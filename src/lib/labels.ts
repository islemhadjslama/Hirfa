// Traductions françaises des valeurs techniques (statuts, rôles).
// Les types seront remplacés par ceux de `src/types/database.ts` après la Phase 1.

export type UserRole = 'client' | 'artisan' | 'admin'
export type ArtisanStatus = 'pending' | 'approved' | 'rejected' | 'suspended'
export type ProductStatus = 'draft' | 'published'
export type SubOrderStatus =
  'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'

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
