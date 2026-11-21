import { useEffect, useMemo } from 'react'

import { useAppSettings, useCartProducts } from '@/features/cart/api'
import { useCartStore, type CartItem } from '@/stores/cart'

export type CartLine = CartItem & {
  lineTotal: number
  /** Raison pour laquelle la ligne ne peut pas être commandée (null si tout va bien). */
  problem: string | null
}

export type CartGroup = {
  artisanSlug: string
  artisanName: string
  lines: CartLine[]
  subtotal: number
  shippingFee: number
  total: number
}

/**
 * PAN-2 — Panier groupé par artisan, avec données fraîches du catalogue,
 * frais de livraison par sous-commande et totaux (indicatifs : le serveur
 * recalcule tout dans place_order).
 */
export function useCart() {
  const items = useCartStore((state) => state.items)
  const sync = useCartStore((state) => state.sync)
  const products = useCartProducts(items.map((item) => item.productId))
  const settings = useAppSettings()

  // Prix, stock et nom à jour ; quantités ramenées au stock disponible
  useEffect(() => {
    if (products.data) sync(products.data)
  }, [products.data, sync])

  return useMemo(() => {
    const fresh = products.data
    const fee = settings.data?.shipping_fee ?? 0
    const groups = new Map<string, CartGroup>()

    for (const item of items) {
      let problem: string | null = null
      if (fresh && !fresh.has(item.productId)) problem = 'Ce produit n’est plus disponible.'
      else if (fresh && item.stock === 0) problem = 'Rupture de stock.'
      const lineTotal = problem ? 0 : item.price * item.quantity

      const group = groups.get(item.artisanSlug) ?? {
        artisanSlug: item.artisanSlug,
        artisanName: item.artisanName,
        lines: [],
        subtotal: 0,
        shippingFee: 0,
        total: 0,
      }
      group.lines.push({ ...item, lineTotal, problem })
      group.subtotal += lineTotal
      groups.set(item.artisanSlug, group)
    }

    // Frais de livraison : une fois par artisan ayant au moins une ligne commandable
    for (const group of groups.values()) {
      group.shippingFee = group.lines.some((line) => !line.problem) ? fee : 0
      group.total = group.subtotal + group.shippingFee
    }

    const list = [...groups.values()]
    const orderable = list.flatMap((group) => group.lines.filter((line) => !line.problem))
    return {
      items,
      groups: list,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: list.reduce((sum, group) => sum + group.subtotal, 0),
      shippingTotal: list.reduce((sum, group) => sum + group.shippingFee, 0),
      total: list.reduce((sum, group) => sum + group.total, 0),
      shippingFee: fee,
      /** Lignes à envoyer à place_order. */
      orderItems: orderable.map((line) => ({
        product_id: line.productId,
        quantity: line.quantity,
      })),
      hasProblems: list.some((group) => group.lines.some((line) => line.problem)),
      isChecking: items.length > 0 && (products.isPending || settings.isPending),
      isError: products.isError || settings.isError,
      refetch: () => {
        void products.refetch()
        void settings.refetch()
      },
    }
  }, [items, products, settings])
}
