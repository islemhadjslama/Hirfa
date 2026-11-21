import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { CatalogProduct } from '@/features/catalog/api'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'

const favoritesKey = (clientId: string | undefined) => ['favorites', 'ids', clientId]

/** Ids des produits favoris du client connecté (vide pour les autres rôles). */
export function useFavoriteIds() {
  const { profile } = useProfile()
  const clientId = profile?.role === 'client' ? profile.id : undefined
  return useQuery({
    queryKey: favoritesKey(clientId),
    enabled: Boolean(clientId),
    queryFn: async () => {
      const { data, error } = await supabase.from('favorites').select('product_id')
      if (error) throw error
      return new Set(data.map((row) => row.product_id))
    },
  })
}

/** Ajout / retrait d'un favori, avec mise à jour optimiste. */
export function useToggleFavorite() {
  const client = useQueryClient()
  const { profile } = useProfile()
  const key = favoritesKey(profile?.id)

  return useMutation({
    mutationFn: async ({ productId, favorite }: { productId: number; favorite: boolean }) => {
      if (!profile) throw new Error('Connectez-vous pour gérer vos favoris.')
      const { error } = favorite
        ? await supabase.from('favorites').insert({ client_id: profile.id, product_id: productId })
        : await supabase
            .from('favorites')
            .delete()
            .eq('client_id', profile.id)
            .eq('product_id', productId)
      if (error && error.code !== '23505') throw error
    },
    onMutate: async ({ productId, favorite }) => {
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<Set<number>>(key)
      const next = new Set(previous)
      if (favorite) next.add(productId)
      else next.delete(productId)
      client.setQueryData(key, next)
      return { previous }
    },
    onError: (_error, _variables, context) => {
      client.setQueryData(key, context?.previous)
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['favorites'] }),
  })
}

/**
 * CLI-5 — Produits favoris, du plus récent au plus ancien. Les produits qui ne
 * sont plus visibles (RM-1) sont renvoyés à part pour pouvoir être retirés.
 */
export function useFavoriteProducts() {
  const { profile } = useProfile()
  const clientId = profile?.role === 'client' ? profile.id : undefined
  return useQuery({
    queryKey: ['favorites', 'products', clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      const { data: favorites, error } = await supabase
        .from('favorites')
        .select('product_id, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      if (favorites.length === 0) return { products: [], unavailableIds: [] }

      const ids = favorites.map((favorite) => favorite.product_id)
      const { data: rows, error: catalogError } = await supabase
        .from('catalog_products')
        .select(
          'id, name, slug, price, stock, artisan_name, artisan_slug, avg_rating, reviews_count, image_path',
        )
        .in('id', ids)
      if (catalogError) throw catalogError

      const byId = new Map(rows.map((row) => [row.id, row]))
      const products: CatalogProduct[] = []
      const unavailableIds: number[] = []
      for (const productId of ids) {
        const row = byId.get(productId)
        if (!row) {
          unavailableIds.push(productId)
          continue
        }
        products.push({
          id: productId,
          name: row.name ?? '',
          slug: row.slug ?? '',
          price: Number(row.price ?? 0),
          stock: row.stock ?? 0,
          artisanName: row.artisan_name ?? '',
          artisanSlug: row.artisan_slug ?? '',
          avgRating: Number(row.avg_rating ?? 0),
          reviewsCount: row.reviews_count ?? 0,
          imagePath: row.image_path,
        })
      }
      return { products, unavailableIds }
    },
  })
}
