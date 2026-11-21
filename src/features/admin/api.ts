import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ArtisanStatus, ProductStatus, SubOrderStatus } from '@/lib/labels'
import { supabase } from '@/lib/supabase'

/** Liste paginée générique. */
export type Page<T> = { rows: T[]; total: number }
export const ADMIN_PAGE_SIZE = 20

const rangeFor = (page: number) => {
  const from = (page - 1) * ADMIN_PAGE_SIZE
  return [from, from + ADMIN_PAGE_SIZE - 1] as const
}

/** Échappe les caractères spéciaux d'un filtre `or()` / `ilike` PostgREST. */
function searchTerm(value: string): string {
  return value
    .trim()
    .replace(/[%_\\]/g, '\\$&')
    .replace(/[,()"]/g, ' ')
}

function invalidate(client: ReturnType<typeof useQueryClient>, keys: string[]) {
  for (const key of keys) void client.invalidateQueries({ queryKey: [key] })
}

// =============================================================================
// ADM-1 — Tableau de bord
// =============================================================================

export type AdminStats = {
  clients: number
  artisans: {
    total: number
    pending: number
    approved: number
    rejected: number
    suspended: number
  }
  products: number
  orders: number
  revenue: number
  orders_by_month: { month: string; orders: number }[]
  pending_artisans: {
    id: string
    shop_name: string
    slug: string
    governorate: string | null
    created_at: string
    full_name: string
    email: string | null
  }[]
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_dashboard_stats')
      if (error) throw error
      // Forme garantie par la fonction SQL admin_dashboard_stats (migration 2)
      return data as unknown as AdminStats
    },
  })
}

// =============================================================================
// ADM-2 — Artisans
// =============================================================================

const ADMIN_ARTISAN_COLUMNS = `
  id, shop_name, slug, bio, status, rejection_reason, approved_at, created_at, governorate, city,
  address, logo_url, banner_url, facebook_url, instagram_url, whatsapp,
  specialty:categories ( name ),
  profile:profiles ( full_name, email, phone, is_active )
`

export function useAdminArtisans(filters: {
  status: ArtisanStatus | null
  q: string
  page: number
}) {
  return useQuery({
    queryKey: ['admin', 'artisans', filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase
        .from('artisan_profiles')
        .select(ADMIN_ARTISAN_COLUMNS, { count: 'exact' })
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.q) query = query.ilike('shop_name', `%${searchTerm(filters.q)}%`)
      const [from, to] = rangeFor(filters.page)
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)
      if (error && error.code === 'PGRST103') return { rows: [], total: count ?? 0 }
      if (error) throw error
      return { rows: data, total: count ?? 0 }
    },
  })
}

export type AdminArtisan = NonNullable<ReturnType<typeof useAdminArtisans>['data']>['rows'][number]

export function useAdminArtisan(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'artisan', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artisan_profiles')
        .select(ADMIN_ARTISAN_COLUMNS)
        .eq('id', id as string)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

/** Approuver, refuser (motif obligatoire), suspendre, réactiver (trigger RM-9 côté base). */
export function useSetArtisanStatus() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({
      artisanId,
      status,
      reason,
    }: {
      artisanId: string
      status: ArtisanStatus
      reason?: string
    }) => {
      const { error } = await supabase
        .from('artisan_profiles')
        .update({ status, rejection_reason: status === 'rejected' ? (reason ?? null) : null })
        .eq('id', artisanId)
      if (error) throw error
    },
    onSettled: () => invalidate(client, ['admin', 'catalog', 'artisans', 'artisan-shop']),
  })
}

// =============================================================================
// ADM-3 — Clients
// =============================================================================

export function useAdminClients(filters: { q: string; page: number }) {
  return useQuery({
    queryKey: ['admin', 'clients', filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, phone, governorate, city, is_active, created_at', {
          count: 'exact',
        })
        .eq('role', 'client')
      if (filters.q) {
        const term = searchTerm(filters.q)
        query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
      }
      const [from, to] = rangeFor(filters.page)
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)
      if (error && error.code === 'PGRST103') return { rows: [], total: count ?? 0 }
      if (error) throw error
      return { rows: data, total: count ?? 0 }
    },
  })
}

export function useAdminClient(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'client', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `id, role, full_name, email, phone, governorate, city, address, is_active, created_at,
           orders ( id, order_number, created_at, total, sub_orders ( id, status ) )`,
        )
        .eq('id', id as string)
        .order('created_at', { referencedTable: 'orders', ascending: false })
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

/** Activer / désactiver un compte (AUTH-6 : déconnexion immédiate côté utilisateur). */
export function useSetAccountActive() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: active })
        .eq('id', userId)
      if (error) throw error
    },
    onSettled: () => invalidate(client, ['admin', 'catalog', 'artisans']),
  })
}

// =============================================================================
// ADM-4 — Produits
// =============================================================================

export type AdminProductFilter = ProductStatus | 'hidden' | 'featured' | null

export function useAdminProducts(filters: {
  q: string
  artisanId: string | null
  categoryId: number | null
  status: AdminProductFilter
  page: number
}) {
  return useQuery({
    queryKey: ['admin', 'products', filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase.from('products').select(
        `id, name, slug, price, stock, status, admin_hidden, is_featured, views_count, created_at,
           artisan:artisan_profiles ( id, shop_name, status ),
           category:categories ( name ),
           product_images ( path, position )`,
        { count: 'exact' },
      )
      if (filters.q) query = query.ilike('name', `%${searchTerm(filters.q)}%`)
      if (filters.artisanId) query = query.eq('artisan_id', filters.artisanId)
      if (filters.categoryId !== null) query = query.eq('category_id', filters.categoryId)
      if (filters.status === 'hidden') query = query.eq('admin_hidden', true)
      else if (filters.status === 'featured') query = query.eq('is_featured', true)
      else if (filters.status) query = query.eq('status', filters.status)
      const [from, to] = rangeFor(filters.page)
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .order('position', { referencedTable: 'product_images' })
        .range(from, to)
      if (error && error.code === 'PGRST103') return { rows: [], total: count ?? 0 }
      if (error) throw error
      return { rows: data, total: count ?? 0 }
    },
  })
}

export type AdminProduct = NonNullable<ReturnType<typeof useAdminProducts>['data']>['rows'][number]

/** Masquer / démasquer, mettre en avant (colonnes réservées à l'admin — RM-9). */
export function useUpdateProductFlags() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({
      productId,
      flags,
    }: {
      productId: number
      flags: { admin_hidden?: boolean; is_featured?: boolean }
    }) => {
      const { error } = await supabase.from('products').update(flags).eq('id', productId)
      if (error) throw error
    },
    onSettled: () => invalidate(client, ['admin', 'catalog', 'product', 'artisan-shop']),
  })
}

/** Liste courte des boutiques pour les filtres (tous statuts). */
export function useAdminArtisanOptions() {
  return useQuery({
    queryKey: ['admin', 'artisan-options'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artisan_profiles')
        .select('id, shop_name')
        .order('shop_name')
      if (error) throw error
      return data
    },
  })
}

// =============================================================================
// ADM-5 — Catégories
// =============================================================================

export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select(
          'id, name, slug, description, image_url, sort_order, is_active, created_at, products(count)',
        )
        .order('sort_order')
        .order('name')
      if (error) throw error
      return data
    },
  })
}

export type AdminCategory = NonNullable<ReturnType<typeof useAdminCategories>['data']>[number]

export type CategoryInput = {
  name: string
  slug: string
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}

export function useSaveCategory() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: number | null; input: CategoryInput }) => {
      const { error } =
        id === null
          ? await supabase.from('categories').insert(input)
          : await supabase.from('categories').update(input).eq('id', id)
      if (error?.code === '23505')
        throw new Error('Ce slug est déjà utilisé par une autre catégorie.')
      if (error) throw error
    },
    onSettled: () => invalidate(client, ['admin', 'categories', 'catalog']),
  })
}

export function useDeleteCategory() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSettled: () => invalidate(client, ['admin', 'categories', 'catalog']),
  })
}

// =============================================================================
// ADM-6 — Commandes
// =============================================================================

export function useAdminSubOrders(filters: {
  status: SubOrderStatus | null
  artisanId: string | null
  from: string
  to: string
  page: number
}) {
  return useQuery({
    queryKey: ['admin', 'sub-orders', filters],
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      let query = supabase.from('sub_orders').select(
        `id, status, total, created_at,
           artisan:artisan_profiles ( shop_name ),
           order:orders ( id, order_number, shipping_full_name )`,
        { count: 'exact' },
      )
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.artisanId) query = query.eq('artisan_id', filters.artisanId)
      // Dates du sélecteur (jour local) → bornes incluses
      if (filters.from)
        query = query.gte('created_at', new Date(`${filters.from}T00:00:00`).toISOString())
      if (filters.to)
        query = query.lte('created_at', new Date(`${filters.to}T23:59:59.999`).toISOString())
      const [from, to] = rangeFor(filters.page)
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to)
      if (error && error.code === 'PGRST103') return { rows: [], total: count ?? 0 }
      if (error) throw error
      return { rows: data, total: count ?? 0 }
    },
  })
}

// =============================================================================
// ADM-7 — Avis
// =============================================================================

export function useAdminReviews(filters: {
  visibility: 'all' | 'visible' | 'hidden'
  page: number
}) {
  return useQuery({
    queryKey: ['admin', 'reviews', filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase.from('reviews').select(
        `id, rating, comment, is_hidden, created_at,
           product:products ( name, slug ),
           client:profiles ( full_name, email )`,
        { count: 'exact' },
      )
      if (filters.visibility !== 'all')
        query = query.eq('is_hidden', filters.visibility === 'hidden')
      const [from, to] = rangeFor(filters.page)
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)
      if (error && error.code === 'PGRST103') return { rows: [], total: count ?? 0 }
      if (error) throw error
      return { rows: data, total: count ?? 0 }
    },
  })
}

export function useSetReviewHidden() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ reviewId, hidden }: { reviewId: number; hidden: boolean }) => {
      const { error } = await supabase
        .from('reviews')
        .update({ is_hidden: hidden })
        .eq('id', reviewId)
      if (error) throw error
    },
    onSettled: () => invalidate(client, ['admin', 'reviews', 'catalog', 'product']),
  })
}

export function useAdminDeleteReview() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (reviewId: number) => {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
      if (error) throw error
    },
    onSettled: () => invalidate(client, ['admin', 'reviews', 'catalog', 'product']),
  })
}

// =============================================================================
// ADM-8 — Paramètres
// =============================================================================

export function useUpdateSettings() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      shipping_fee: number
      site_name: string
      contact_email: string | null
    }) => {
      const { error } = await supabase.from('app_settings').update(input).eq('id', 1)
      if (error) throw error
    },
    onSettled: () => invalidate(client, ['app-settings', 'cart-products']),
  })
}
