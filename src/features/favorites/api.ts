import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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
