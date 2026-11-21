import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ReviewValues } from '@/features/reviews/schemas'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'

export type MyReview = {
  id: number
  product_id: number
  rating: number
  comment: string | null
  is_hidden: boolean
  created_at: string
  updated_at: string
}

/** Avis du client connecté, indexés par produit (y compris ceux masqués par l'admin). */
export function useMyReviews() {
  const { profile } = useProfile()
  const clientId = profile?.role === 'client' ? profile.id : undefined
  return useQuery({
    queryKey: ['reviews', 'mine', clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, product_id, rating, comment, is_hidden, created_at, updated_at')
        .eq('client_id', clientId as string)
      if (error) throw error
      return new Map<number, MyReview>(data.map((review) => [review.product_id, review]))
    },
  })
}

/** RM-8 — Le client connecté a-t-il reçu ce produit (sous-commande livrée) ? */
export function useCanReview(productId: number | undefined) {
  const { profile } = useProfile()
  const isClient = profile?.role === 'client'
  return useQuery({
    queryKey: ['reviews', 'can-review', profile?.id, productId],
    enabled: isClient && productId !== undefined,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('can_review_product', {
        p_product_id: productId as number,
      })
      if (error) throw error
      return data
    },
  })
}

function invalidateReviews(client: ReturnType<typeof useQueryClient>) {
  // Avis, notes moyennes du catalogue et des fiches produit
  for (const key of ['reviews', 'catalog', 'product', 'artisan-shop', 'artisan-reviews']) {
    void client.invalidateQueries({ queryKey: [key] })
  }
}

/** Création (un seul avis par produit et par client) ou modification de son avis. */
export function useSaveReview() {
  const client = useQueryClient()
  const { profile } = useProfile()
  return useMutation({
    mutationFn: async ({
      productId,
      reviewId,
      values,
    }: {
      productId: number
      reviewId: number | null
      values: ReviewValues
    }) => {
      if (!profile) throw new Error('Connectez-vous pour donner votre avis.')
      const fields = { rating: values.rating, comment: values.comment || null }
      const { error } =
        reviewId === null
          ? await supabase
              .from('reviews')
              .insert({ ...fields, product_id: productId, client_id: profile.id })
          : await supabase.from('reviews').update(fields).eq('id', reviewId)
      if (error?.code === '23505') {
        throw new Error('Vous avez déjà donné votre avis sur ce produit.')
      }
      if (error && /row-level security/i.test(error.message)) {
        throw new Error('Vous pourrez donner votre avis après avoir reçu ce produit.')
      }
      if (error) throw error
    },
    onSettled: () => invalidateReviews(client),
  })
}

export function useDeleteReview() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (reviewId: number) => {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
      if (error) throw error
    },
    onSettled: () => invalidateReviews(client),
  })
}

// =============================================================================
// ART-9 — Avis reçus par l'artisan (lecture seule)
// =============================================================================

export type ReceivedReview = {
  id: number
  rating: number
  comment: string
  created_at: string
  author_name: string
  product: { id: number; name: string; slug: string }
}

/**
 * Produits de l'artisan ayant des avis visibles, puis `product_reviews()` pour
 * chacun (nom d'auteur abrégé, sans accès à la table profiles).
 */
export function useArtisanReviews(artisanId: string | undefined) {
  return useQuery({
    queryKey: ['artisan-reviews', artisanId],
    enabled: Boolean(artisanId),
    queryFn: async (): Promise<ReceivedReview[]> => {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, slug, reviews!inner(id)')
        .eq('artisan_id', artisanId as string)
        .eq('reviews.is_hidden', false)
      if (error) throw error

      const lists = await Promise.all(
        products.map(async (product) => {
          const { data, error: rpcError } = await supabase.rpc('product_reviews', {
            p_product_id: product.id,
          })
          if (rpcError) throw rpcError
          return data.map((review) => ({
            ...review,
            product: { id: product.id, name: product.name, slug: product.slug },
          }))
        }),
      )
      return lists.flat().sort((a, b) => b.created_at.localeCompare(a.created_at))
    },
  })
}
