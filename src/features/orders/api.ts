import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

const ORDER_COLUMNS = `
  id, order_number, created_at, subtotal, shipping_total, total,
  shipping_full_name, shipping_phone, shipping_governorate, shipping_city, shipping_address, notes,
  sub_orders (
    id, status, subtotal, shipping_fee, total, cancel_reason,
    artisan:artisan_profiles ( shop_name, slug ),
    order_items ( id, product_id, product_name, unit_price, quantity, line_total )
  )
`

/** Commande complète (lisible par son client, ses artisans et l'admin — RLS). */
export function useOrder(orderId: number | null) {
  return useQuery({
    queryKey: ['order', orderId],
    enabled: orderId !== null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(ORDER_COLUMNS)
        .eq('id', orderId as number)
        .order('id', { referencedTable: 'sub_orders' })
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export type OrderDetails = NonNullable<ReturnType<typeof useOrder>['data']>
