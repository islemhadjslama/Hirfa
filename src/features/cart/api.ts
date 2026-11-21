import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { CartProductSnapshot } from '@/stores/cart'
import { supabase } from '@/lib/supabase'

/** Paramètres publics du site (frais de livraison par sous-commande). */
export function useAppSettings() {
  return useQuery({
    queryKey: ['app-settings'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('shipping_fee, site_name, contact_email')
        .eq('id', 1)
        .single()
      if (error) throw error
      return { ...data, shipping_fee: Number(data.shipping_fee) }
    },
  })
}

/**
 * Données fraîches des produits du panier, depuis la vue du catalogue (RM-1).
 * Un produit absent du résultat n'est plus disponible.
 */
export function useCartProducts(productIds: number[]) {
  const ids = [...productIds].sort((a, b) => a - b)
  return useQuery({
    queryKey: ['cart-products', ids],
    enabled: ids.length > 0,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_products')
        .select('id, slug, name, price, stock, image_path, artisan_slug, artisan_name')
        .in('id', ids)
      if (error) throw error
      const map = new Map<number, CartProductSnapshot>()
      for (const row of data) {
        if (row.id === null) continue
        map.set(row.id, {
          productId: row.id,
          slug: row.slug ?? '',
          name: row.name ?? '',
          price: Number(row.price ?? 0),
          stock: row.stock ?? 0,
          imagePath: row.image_path,
          artisanSlug: row.artisan_slug ?? '',
          artisanName: row.artisan_name ?? '',
        })
      }
      return map
    },
  })
}

export type ShippingInput = {
  full_name: string
  phone: string
  governorate: string
  city: string
  address: string
  notes: string
}

/** PAN-5 — Création de la commande en une transaction (RPC place_order). */
export function usePlaceOrder() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({
      items,
      shipping,
    }: {
      items: { product_id: number; quantity: number }[]
      shipping: ShippingInput
    }) => {
      const { data, error } = await supabase.rpc('place_order', {
        p_items: items,
        p_shipping: shipping,
      })
      if (error) throw error
      return data
    },
    // Le stock a changé (succès) ou n'était plus suffisant (erreur) : on rafraîchit
    onSettled: () => {
      void client.invalidateQueries({ queryKey: ['cart-products'] })
      void client.invalidateQueries({ queryKey: ['catalog'] })
      void client.invalidateQueries({ queryKey: ['product'] })
    },
  })
}
