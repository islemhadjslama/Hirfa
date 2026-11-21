import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

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
