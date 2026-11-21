// Traductions françaises des valeurs techniques (statuts, rôles).
import type { Enums } from '@/types/database'

export type UserRole = Enums<'user_role'>
export type ArtisanStatus = Enums<'artisan_status'>
export type ProductStatus = Enums<'product_status'>
export type SubOrderStatus = Enums<'sub_order_status'>

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  client: 'Client',
  artisan: 'Artisan',
  admin: 'Administrateur',
}

export const ARTISAN_STATUS_LABELS: Record<ArtisanStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Refusé',
  suspended: 'Suspendu',
}

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: 'Brouillon',
  published: 'Publié',
}

export const SUB_ORDER_STATUS_LABELS: Record<SubOrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}
