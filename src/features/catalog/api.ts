import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { PRODUCTS_PER_PAGE } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

// =============================================================================
// Catégories
// =============================================================================

/** Catégories actives, dans l'ordre d'affichage. */
export function useCategories() {
  return useQuery({
    queryKey: ['categories', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description, image_url, sort_order')
        .eq('is_active', true)
        .order('sort_order')
        .order('name')
      if (error) throw error
      return data
    },
    staleTime: 5 * 60_000,
  })
}

// =============================================================================
// Produits du catalogue (vue `catalog_products`, qui applique RM-1)
// =============================================================================

export type CatalogProduct = {
  id: number
  name: string
  slug: string
  price: number
  stock: number
  artisanName: string
  artisanSlug: string
  avgRating: number
  reviewsCount: number
  imagePath: string | null
}

const CARD_COLUMNS =
  'id, name, slug, price, stock, artisan_name, artisan_slug, avg_rating, reviews_count, image_path'

type CardRow = Pick<
  Tables<'catalog_products'>,
  | 'id'
  | 'name'
  | 'slug'
  | 'price'
  | 'stock'
  | 'artisan_name'
  | 'artisan_slug'
  | 'avg_rating'
  | 'reviews_count'
  | 'image_path'
>

/** Les colonnes d'une vue sont typées « nullable » : on normalise une fois ici. */
function toCatalogProduct(row: CardRow): CatalogProduct {
  return {
    id: row.id ?? 0,
    name: row.name ?? '',
    slug: row.slug ?? '',
    price: Number(row.price ?? 0),
    stock: row.stock ?? 0,
    artisanName: row.artisan_name ?? '',
    artisanSlug: row.artisan_slug ?? '',
    avgRating: Number(row.avg_rating ?? 0),
    reviewsCount: row.reviews_count ?? 0,
    imagePath: row.image_path,
  }
}

export const CATALOG_SORTS = {
  recent: 'Plus récents',
  'prix-croissant': 'Prix croissant',
  'prix-decroissant': 'Prix décroissant',
  note: 'Mieux notés',
} as const

export type CatalogSort = keyof typeof CATALOG_SORTS

/** Filtres du catalogue, synchronisés avec l'URL (CAT-2). */
export type CatalogFilters = {
  q: string
  categorie: string
  min: string
  max: string
  gouvernorat: string
  artisan: string
  stock: boolean
  tri: CatalogSort
  page: number
}

export function parseCatalogParams(params: URLSearchParams): CatalogFilters {
  const tri = params.get('tri') ?? 'recent'
  const page = Number(params.get('page') ?? '1')
  return {
    q: params.get('q')?.trim() ?? '',
    categorie: params.get('categorie') ?? '',
    min: params.get('min') ?? '',
    max: params.get('max') ?? '',
    gouvernorat: params.get('gouvernorat') ?? '',
    artisan: params.get('artisan') ?? '',
    stock: params.get('stock') === '1',
    tri: tri in CATALOG_SORTS ? (tri as CatalogSort) : 'recent',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

/** « Céramique Œuvre » → « ceramique oeuvre » (même normalisation que `search_text`). */
export function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

function parseAmount(value: string): number | null {
  const amount = Number(value.replace(',', '.'))
  return value.trim() !== '' && Number.isFinite(amount) && amount >= 0 ? amount : null
}

/** CAT-1 à CAT-4 — Recherche, filtres, tri et pagination côté serveur. */
export function useCatalogProducts(filters: CatalogFilters) {
  return useQuery({
    queryKey: ['catalog', filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase.from('catalog_products').select(CARD_COLUMNS, { count: 'exact' })

      if (filters.q) {
        // Les jokers saisis par l'utilisateur sont échappés
        const term = normalizeSearch(filters.q).replace(/[%_\\]/g, '\\$&')
        query = query.ilike('search_text', `%${term}%`)
      }
      if (filters.categorie) query = query.eq('category_slug', filters.categorie)
      if (filters.gouvernorat) query = query.eq('artisan_governorate', filters.gouvernorat)
      if (filters.artisan) query = query.eq('artisan_slug', filters.artisan)
      if (filters.stock) query = query.gt('stock', 0)
      const min = parseAmount(filters.min)
      const max = parseAmount(filters.max)
      if (min !== null) query = query.gte('price', min)
      if (max !== null) query = query.lte('price', max)

      switch (filters.tri) {
        case 'prix-croissant':
          query = query.order('price', { ascending: true })
          break
        case 'prix-decroissant':
          query = query.order('price', { ascending: false })
          break
        case 'note':
          query = query
            .order('avg_rating', { ascending: false })
            .order('reviews_count', { ascending: false })
          break
        default:
          break
      }
      query = query.order('created_at', { ascending: false }).order('id', { ascending: false })

      const from = (filters.page - 1) * PRODUCTS_PER_PAGE
      const { data, error, count } = await query.range(from, from + PRODUCTS_PER_PAGE - 1)
      // Page au-delà du dernier résultat : PostgREST répond 416
      if (error && error.code === 'PGRST103') return { products: [], total: count ?? 0 }
      if (error) throw error
      return { products: data.map(toCatalogProduct), total: count ?? 0 }
    },
  })
}

/** ACC-4 — Produits mis en avant (8 max) ; à défaut, les dernières créations. */
export function useHomeProducts() {
  return useQuery({
    queryKey: ['catalog', 'home'],
    queryFn: async () => {
      const featured = await supabase
        .from('catalog_products')
        .select(CARD_COLUMNS)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(8)
      if (featured.error) throw featured.error
      if (featured.data.length > 0) {
        return { kind: 'featured' as const, products: featured.data.map(toCatalogProduct) }
      }
      const recent = await supabase
        .from('catalog_products')
        .select(CARD_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(8)
      if (recent.error) throw recent.error
      return { kind: 'recent' as const, products: recent.data.map(toCatalogProduct) }
    },
  })
}

// =============================================================================
// Fiche produit (CAT-6)
// =============================================================================

export type ProductDetails = CatalogProduct & {
  description: string
  categoryName: string
  categorySlug: string
  images: string[]
  artisan: Pick<
    Tables<'artisan_profiles'>,
    'id' | 'shop_name' | 'slug' | 'logo_url' | 'city' | 'governorate'
  >
}

export function useProductDetails(slug: string | undefined) {
  return useQuery({
    queryKey: ['product', slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<ProductDetails | null> => {
      const { data: row, error } = await supabase
        .from('catalog_products')
        .select(`${CARD_COLUMNS}, description, category_name, category_slug, artisan_id`)
        .eq('slug', slug as string)
        .maybeSingle()
      if (error) throw error
      if (!row || row.id === null || !row.artisan_id) return null

      const [images, artisan] = await Promise.all([
        supabase
          .from('product_images')
          .select('path')
          .eq('product_id', row.id)
          .order('position')
          .order('id'),
        supabase
          .from('artisan_profiles')
          .select('id, shop_name, slug, logo_url, city, governorate')
          .eq('id', row.artisan_id)
          .single(),
      ])
      if (images.error) throw images.error
      if (artisan.error) throw artisan.error

      return {
        ...toCatalogProduct(row),
        description: row.description ?? '',
        categoryName: row.category_name ?? '',
        categorySlug: row.category_slug ?? '',
        images: images.data.map((image) => image.path),
        artisan: artisan.data,
      }
    },
  })
}

export function useProductReviews(productId: number | undefined) {
  return useQuery({
    queryKey: ['reviews', 'product', productId],
    enabled: productId !== undefined,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('product_reviews', {
        p_product_id: productId as number,
      })
      if (error) throw error
      return data
    },
  })
}

/** « Autres produits de cet artisan » (4 max). */
export function useOtherArtisanProducts(artisanSlug: string | undefined, excludeId?: number) {
  return useQuery({
    queryKey: ['catalog', 'artisan-others', artisanSlug, excludeId],
    enabled: Boolean(artisanSlug),
    queryFn: async () => {
      let query = supabase
        .from('catalog_products')
        .select(CARD_COLUMNS)
        .eq('artisan_slug', artisanSlug as string)
        .order('created_at', { ascending: false })
        .limit(4)
      if (excludeId !== undefined) query = query.neq('id', excludeId)
      const { data, error } = await query
      if (error) throw error
      return data.map(toCatalogProduct)
    },
  })
}

/** CAT-6 — +1 vue (la fonction ignore le propriétaire et les produits invisibles). */
export async function recordProductView(productId: number) {
  await supabase.rpc('increment_product_view', { p_product_id: productId })
}

// =============================================================================
// Artisans (CAT-7, CAT-8, ACC-5)
// =============================================================================

const ARTISAN_COLUMNS =
  'id, shop_name, slug, bio, logo_url, banner_url, governorate, city, approved_at, created_at, specialty_category_id, specialty:categories(name, slug)'

export type PublicArtisan = {
  id: string
  shop_name: string
  slug: string
  bio: string | null
  logo_url: string | null
  banner_url: string | null
  governorate: string | null
  city: string | null
  approved_at: string | null
  created_at: string
  specialty_category_id: number | null
  specialty: { name: string; slug: string } | null
}

export const ARTISANS_PER_PAGE = 12

export type ArtisanFilters = { gouvernorat: string; specialiteId: number | null; page: number }

export function useArtisans(filters: ArtisanFilters) {
  return useQuery({
    queryKey: ['artisans', filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase
        .from('artisan_profiles')
        .select(ARTISAN_COLUMNS, { count: 'exact' })
        // La RLS laisse un artisan voir sa propre boutique : on filtre explicitement
        .eq('status', 'approved')
      if (filters.gouvernorat) query = query.eq('governorate', filters.gouvernorat)
      if (filters.specialiteId !== null) {
        query = query.eq('specialty_category_id', filters.specialiteId)
      }
      const from = (filters.page - 1) * ARTISANS_PER_PAGE
      const { data, error, count } = await query
        .order('shop_name')
        .range(from, from + ARTISANS_PER_PAGE - 1)
      if (error && error.code === 'PGRST103') return { artisans: [], total: count ?? 0 }
      if (error) throw error
      return { artisans: data as PublicArtisan[], total: count ?? 0 }
    },
  })
}

/** ACC-5 — Les 6 artisans approuvés les plus récents. */
export function useRecentArtisans() {
  return useQuery({
    queryKey: ['artisans', 'recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artisan_profiles')
        .select(ARTISAN_COLUMNS)
        .eq('status', 'approved')
        .order('approved_at', { ascending: false, nullsFirst: false })
        .limit(6)
      if (error) throw error
      return data as PublicArtisan[]
    },
  })
}

/** Liste courte des artisans approuvés pour le filtre « Artisan » du catalogue. */
export function useArtisanOptions() {
  return useQuery({
    queryKey: ['artisans', 'options'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artisan_profiles')
        .select('slug, shop_name')
        .eq('status', 'approved')
        .order('shop_name')
      if (error) throw error
      return data
    },
  })
}

export type ArtisanShop = PublicArtisan &
  Pick<Tables<'artisan_profiles'>, 'facebook_url' | 'instagram_url' | 'whatsapp'> & {
    products: CatalogProduct[]
    avgRating: number
    reviewsCount: number
  }

/** CAT-8 — Boutique publique avec tous ses produits visibles. */
export function useArtisanShop(slug: string | undefined) {
  return useQuery({
    queryKey: ['artisan-shop', slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<ArtisanShop | null> => {
      const { data: shop, error } = await supabase
        .from('artisan_profiles')
        .select(`${ARTISAN_COLUMNS}, facebook_url, instagram_url, whatsapp`)
        .eq('slug', slug as string)
        .eq('status', 'approved')
        .maybeSingle()
      if (error) throw error
      if (!shop) return null

      const { data: rows, error: productsError } = await supabase
        .from('catalog_products')
        .select(CARD_COLUMNS)
        .eq('artisan_id', shop.id)
        .order('created_at', { ascending: false })
        .limit(200)
      if (productsError) throw productsError
      const products = rows.map(toCatalogProduct)

      // Note moyenne de la boutique, pondérée par le nombre d'avis de chaque produit
      const reviewsCount = products.reduce((sum, product) => sum + product.reviewsCount, 0)
      const avgRating =
        reviewsCount === 0
          ? 0
          : products.reduce((sum, product) => sum + product.avgRating * product.reviewsCount, 0) /
            reviewsCount

      return { ...(shop as ArtisanShop), products, avgRating, reviewsCount }
    },
  })
}
