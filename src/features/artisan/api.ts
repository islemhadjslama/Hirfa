import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ImageItem, SingleImageValue } from '@/features/artisan/images'
import {
  normalizeWhatsapp,
  parsePrice,
  type ProductValues,
  type ShopValues,
} from '@/features/artisan/schemas'
import { getErrorMessage } from '@/lib/errors'
import { pathFromPublicUrl, publicUrl, removeFiles, uploadImage } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

// =============================================================================
// Boutique (ART-2)
// =============================================================================

export type UpdateShopInput = {
  artisanId: string
  values: ShopValues
  logo: SingleImageValue
  banner: SingleImageValue
  previousLogoUrl: string | null
  previousBannerUrl: string | null
  /** Artisan refusé : renvoie la demande de validation en même temps (rejected → pending). */
  resubmit: boolean
}

/** Envoie le nouveau fichier si besoin et retourne l'URL à enregistrer. */
async function resolveImage(artisanId: string, value: SingleImageValue): Promise<string | null> {
  if (!value) return null
  if (value.kind === 'url') return value.url
  const path = await uploadImage('shop-assets', artisanId, value.file)
  return publicUrl('shop-assets', path)
}

async function updateShop(input: UpdateShopInput) {
  const { artisanId, values } = input
  const logoUrl = await resolveImage(artisanId, input.logo)
  const bannerUrl = await resolveImage(artisanId, input.banner)

  const { error } = await supabase
    .from('artisan_profiles')
    .update({
      shop_name: values.shopName,
      bio: values.bio || null,
      specialty_category_id: Number(values.specialtyCategoryId),
      governorate: values.governorate,
      city: values.city || null,
      address: values.address || null,
      facebook_url: values.facebookUrl || null,
      instagram_url: values.instagramUrl || null,
      whatsapp: normalizeWhatsapp(values.whatsapp),
      logo_url: logoUrl,
      banner_url: bannerUrl,
      ...(input.resubmit ? { status: 'pending' as const } : {}),
    })
    .eq('id', artisanId)
  if (error) throw error

  // Anciennes images remplacées ou retirées : nettoyage au mieux
  const obsolete = [
    input.previousLogoUrl !== logoUrl ? input.previousLogoUrl : null,
    input.previousBannerUrl !== bannerUrl ? input.previousBannerUrl : null,
  ]
    .map((url) => pathFromPublicUrl('shop-assets', url))
    .filter((path): path is string => path !== null)
  await removeFiles('shop-assets', obsolete)
}

export function useUpdateShop() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: updateShop,
    onSuccess: () => client.invalidateQueries({ queryKey: ['profile'] }),
  })
}

// =============================================================================
// Produits (ART-3, ART-4, ART-5)
// =============================================================================

export type ArtisanProduct = Pick<
  Tables<'products'>,
  | 'id'
  | 'name'
  | 'slug'
  | 'description'
  | 'category_id'
  | 'price'
  | 'stock'
  | 'status'
  | 'admin_hidden'
  | 'is_featured'
  | 'views_count'
  | 'created_at'
> & { product_images: Pick<Tables<'product_images'>, 'id' | 'path' | 'position'>[] }

const PRODUCT_COLUMNS =
  'id, name, slug, description, category_id, price, stock, status, admin_hidden, is_featured, views_count, created_at, product_images(id, path, position)'

export const artisanProductsKey = (artisanId: string) => ['artisan', 'products', artisanId]

/** Tous les produits de l'artisan (ART-3). Le filtrage se fait côté client. */
export function useMyProducts(artisanId: string | undefined) {
  return useQuery({
    queryKey: artisanProductsKey(artisanId ?? ''),
    enabled: Boolean(artisanId),
    queryFn: async (): Promise<ArtisanProduct[]> => {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .eq('artisan_id', artisanId as string)
        .order('created_at', { ascending: false })
        .order('position', { referencedTable: 'product_images' })
      if (error) throw error
      return data
    },
  })
}

export function useMyProduct(productId: number | null) {
  return useQuery({
    queryKey: ['artisan', 'product', productId],
    enabled: productId !== null,
    queryFn: async (): Promise<ArtisanProduct | null> => {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .eq('id', productId as number)
        .order('position', { referencedTable: 'product_images' })
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

/** URL de l'image principale (position la plus basse). */
export function mainImageUrl(product: Pick<ArtisanProduct, 'product_images'>): string | null {
  const first = [...product.product_images].sort((a, b) => a.position - b.position)[0]
  return first ? publicUrl('product-images', first.path) : null
}

/** Erreur survenue après la création du produit : on peut rediriger vers sa modification. */
export class ProductImagesError extends Error {
  readonly productId: number

  constructor(message: string, productId: number) {
    super(message)
    this.productId = productId
  }
}

export type SaveProductInput = {
  artisanId: string
  productId: number | null
  values: ProductValues
  images: ImageItem[]
  /** Images enregistrées au chargement du formulaire (pour détecter les suppressions). */
  originalImages: { id: number; path: string }[]
}

async function saveProduct(input: SaveProductInput): Promise<number> {
  const { artisanId, values, images } = input
  const fields = {
    name: values.name,
    description: values.description,
    category_id: Number(values.categoryId),
    price: parsePrice(values.price),
    stock: Number(values.stock),
    status: values.status,
  }

  // 1. Le produit
  let productId = input.productId
  if (productId === null) {
    const { data, error } = await supabase
      .from('products')
      // slug : généré par le trigger protect_products_columns
      .insert({ ...fields, artisan_id: artisanId, slug: '' })
      .select('id')
      .single()
    if (error) throw error
    productId = data.id
  } else {
    const { error } = await supabase.from('products').update(fields).eq('id', productId)
    if (error) throw error
  }

  // 2. Les images : suppressions d'abord (limite de 5), puis ordre, puis ajouts
  try {
    const keptIds = new Set(images.flatMap((image) => (image.kind === 'existing' ? image.id : [])))
    const removed = input.originalImages.filter((image) => !keptIds.has(image.id))
    if (removed.length > 0) {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .in(
          'id',
          removed.map((image) => image.id),
        )
      if (error) throw error
    }

    for (const [position, image] of images.entries()) {
      if (image.kind === 'existing') {
        const { error } = await supabase
          .from('product_images')
          .update({ position })
          .eq('id', image.id)
        if (error) throw error
      } else {
        const path = await uploadImage('product-images', `${artisanId}/${productId}`, image.file)
        const { error } = await supabase
          .from('product_images')
          .insert({ product_id: productId, path, position })
        if (error) {
          await removeFiles('product-images', [path])
          throw error
        }
      }
    }

    await removeFiles(
      'product-images',
      removed.map((image) => image.path),
    )
  } catch (error) {
    throw new ProductImagesError(
      `Produit enregistré, mais les images n’ont pas toutes été enregistrées : ${getErrorMessage(error)}`,
      productId,
    )
  }

  return productId
}

export function useSaveProduct() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: saveProduct,
    onSettled: () => client.invalidateQueries({ queryKey: ['artisan'] }),
  })
}

/**
 * ART-5 : suppression définitive si le produit n'a jamais été commandé, sinon
 * passage en brouillon (le trigger refuse la suppression avec le code 23503).
 */
async function deleteProduct(product: ArtisanProduct): Promise<'deleted' | 'archived'> {
  const { error } = await supabase.from('products').delete().eq('id', product.id)
  if (!error) {
    await removeFiles(
      'product-images',
      product.product_images.map((image) => image.path),
    )
    return 'deleted'
  }
  if (error.code === '23503') {
    const { error: updateError } = await supabase
      .from('products')
      .update({ status: 'draft' })
      .eq('id', product.id)
    if (updateError) throw updateError
    return 'archived'
  }
  throw error
}

export function useDeleteProduct() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: deleteProduct,
    onSettled: () => client.invalidateQueries({ queryKey: ['artisan'] }),
  })
}
