import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/** Ligne du panier. Prix, nom et stock sont rafraîchis depuis le catalogue (voir useCart). */
export type CartItem = {
  productId: number
  slug: string
  name: string
  price: number
  imagePath: string | null
  artisanSlug: string
  artisanName: string
  /** Dernier stock connu (plafond de la quantité). */
  stock: number
  quantity: number
}

export type CartProductSnapshot = Omit<CartItem, 'quantity'>

type CartState = {
  items: CartItem[]
  /** Ajoute une quantité, plafonnée au stock. Retourne la quantité réellement ajoutée. */
  add: (product: CartProductSnapshot, quantity: number) => number
  setQuantity: (productId: number, quantity: number) => void
  remove: (productId: number) => void
  clear: () => void
  /** Met à jour prix, nom, stock depuis le catalogue et ajuste les quantités au stock. */
  sync: (fresh: Map<number, CartProductSnapshot>) => void
}

const clamp = (quantity: number, stock: number) => Math.max(1, Math.min(quantity, stock))

/**
 * PAN-1 — Panier local (Zustand + localStorage), accessible sans compte.
 * Le serveur (RPC place_order) revérifie toujours prix, visibilité et stock.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (product, quantity) => {
        const existing = get().items.find((item) => item.productId === product.productId)
        const current = existing?.quantity ?? 0
        const target = Math.min(current + quantity, product.stock)
        const added = Math.max(0, target - current)
        if (added === 0) return 0
        set((state) => ({
          items: existing
            ? state.items.map((item) =>
                item.productId === product.productId
                  ? { ...item, ...product, quantity: target }
                  : item,
              )
            : [...state.items, { ...product, quantity: target }],
        }))
        return added
      },

      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: clamp(quantity, item.stock) }
              : item,
          ),
        })),

      remove: (productId) =>
        set((state) => ({ items: state.items.filter((item) => item.productId !== productId) })),

      clear: () => set({ items: [] }),

      sync: (fresh) => {
        const items = get().items
        let changed = false
        const next = items.map((item) => {
          const product = fresh.get(item.productId)
          if (!product) return item
          const quantity = product.stock > 0 ? clamp(item.quantity, product.stock) : item.quantity
          if (
            product.price === item.price &&
            product.stock === item.stock &&
            product.name === item.name &&
            product.imagePath === item.imagePath &&
            quantity === item.quantity
          ) {
            return item
          }
          changed = true
          return { ...item, ...product, quantity }
        })
        if (changed) set({ items: next })
      },
    }),
    {
      name: 'hirfa-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
)

/** Nombre total d'articles (icône du header). */
export const selectCartCount = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0)
