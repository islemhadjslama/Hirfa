import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { SubOrderStatus } from '@/lib/labels'
import { supabase } from '@/lib/supabase'

// =============================================================================
// Commande complète (confirmation PAN-6, détail client CLI-3)
// =============================================================================

const ORDER_COLUMNS = `
  id, order_number, created_at, client_id, subtotal, shipping_total, total,
  shipping_full_name, shipping_phone, shipping_governorate, shipping_city, shipping_address, notes,
  sub_orders (
    id, status, subtotal, shipping_fee, total, cancel_reason, artisan_id, created_at, updated_at,
    artisan:artisan_profiles ( shop_name, slug ),
    order_items ( id, product_id, product_name, unit_price, quantity, line_total ),
    sub_order_status_history ( id, status, note, changed_by, created_at )
  )
`

/** Commande complète (lisible par son client, ses artisans et l'admin — RLS). */
export function useOrder(orderId: number | null) {
  return useQuery({
    queryKey: ['order', orderId],
    enabled: orderId !== null,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(ORDER_COLUMNS)
        .eq('id', orderId as number)
        .order('id', { referencedTable: 'sub_orders' })
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      // Historique trié chronologiquement
      for (const sub of data.sub_orders) {
        sub.sub_order_status_history.sort(
          (a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id,
        )
      }
      return data
    },
  })
}

export type OrderDetails = NonNullable<ReturnType<typeof useOrder>['data']>
export type OrderSubOrder = OrderDetails['sub_orders'][number]
export type StatusHistoryEntry = OrderSubOrder['sub_order_status_history'][number]

// =============================================================================
// Mes commandes (CLI-2)
// =============================================================================

export const CLIENT_ORDERS_PER_PAGE = 10

export function useClientOrders(clientId: string | undefined, page: number) {
  return useQuery({
    queryKey: ['client-orders', clientId, page],
    enabled: Boolean(clientId),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const from = (page - 1) * CLIENT_ORDERS_PER_PAGE
      const { data, error, count } = await supabase
        .from('orders')
        .select(
          'id, order_number, created_at, total, sub_orders ( id, status, artisan:artisan_profiles ( shop_name ) )',
          { count: 'exact' },
        )
        // La RLS laisse aussi un artisan lire les commandes qui le concernent : on filtre
        .eq('client_id', clientId as string)
        .order('created_at', { ascending: false })
        .order('id', { referencedTable: 'sub_orders' })
        .range(from, from + CLIENT_ORDERS_PER_PAGE - 1)
      if (error && error.code === 'PGRST103') return { orders: [], total: count ?? 0 }
      if (error) throw error
      return { orders: data, total: count ?? 0 }
    },
  })
}

// =============================================================================
// Sous-commandes de l'artisan (ART-6, ART-7)
// =============================================================================

export const ARTISAN_ORDERS_PER_PAGE = 15

export function useArtisanSubOrders(
  artisanId: string | undefined,
  status: SubOrderStatus | null,
  page: number,
) {
  return useQuery({
    queryKey: ['artisan-sub-orders', artisanId, status, page],
    enabled: Boolean(artisanId),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const from = (page - 1) * ARTISAN_ORDERS_PER_PAGE
      let query = supabase
        .from('sub_orders')
        .select(
          'id, status, total, created_at, order:orders ( id, order_number, shipping_full_name, shipping_city )',
          { count: 'exact' },
        )
        .eq('artisan_id', artisanId as string)
      if (status) query = query.eq('status', status)
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, from + ARTISAN_ORDERS_PER_PAGE - 1)
      if (error && error.code === 'PGRST103') return { subOrders: [], total: count ?? 0 }
      if (error) throw error
      return { subOrders: data, total: count ?? 0 }
    },
  })
}

export function useSubOrder(subOrderId: number | null) {
  return useQuery({
    queryKey: ['sub-order', subOrderId],
    enabled: subOrderId !== null,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sub_orders')
        .select(
          `id, status, subtotal, shipping_fee, total, cancel_reason, artisan_id, created_at,
           artisan:artisan_profiles ( shop_name, slug ),
           order:orders (
             id, order_number, created_at, client_id, notes, shipping_full_name, shipping_phone,
             shipping_governorate, shipping_city, shipping_address
           ),
           order_items ( id, product_id, product_name, unit_price, quantity, line_total ),
           sub_order_status_history ( id, status, note, changed_by, created_at )`,
        )
        .eq('id', subOrderId as number)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      data.sub_order_status_history.sort(
        (a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id,
      )
      return data
    },
  })
}

export type SubOrderDetails = NonNullable<ReturnType<typeof useSubOrder>['data']>

// =============================================================================
// Changement de statut (RM-6) — uniquement via la RPC
// =============================================================================

export function useUpdateSubOrderStatus() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({
      subOrderId,
      status,
      note,
    }: {
      subOrderId: number
      status: SubOrderStatus
      note?: string
    }) => {
      const { error } = await supabase.rpc('update_sub_order_status', {
        p_sub_order_id: subOrderId,
        p_status: status,
        p_note: note?.trim() || undefined,
      })
      if (error) throw error
    },
    // Succès ou refus (statut changé entre-temps) : on relit tout
    onSettled: () => {
      for (const key of ['order', 'sub-order', 'client-orders', 'artisan-sub-orders']) {
        void client.invalidateQueries({ queryKey: [key] })
      }
      // Une annulation restaure le stock
      void client.invalidateQueries({ queryKey: ['catalog'] })
      void client.invalidateQueries({ queryKey: ['product'] })
      void client.invalidateQueries({ queryKey: ['artisan', 'products'] })
    },
  })
}

/** Étape suivante du cycle artisan (RM-6), null si le statut est final. */
export const NEXT_STATUS: Partial<Record<SubOrderStatus, SubOrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'shipped',
  shipped: 'delivered',
}

/** Libellé du bouton qui fait passer à l'étape suivante. */
export const NEXT_STATUS_ACTION: Partial<Record<SubOrderStatus, string>> = {
  pending: 'Confirmer la commande',
  confirmed: 'Commencer la préparation',
  preparing: 'Marquer comme expédiée',
  shipped: 'Marquer comme livrée',
}

/** Statuts depuis lesquels l'artisan peut annuler (RM-6). */
export const ARTISAN_CANCELLABLE: SubOrderStatus[] = ['pending', 'confirmed', 'preparing']
