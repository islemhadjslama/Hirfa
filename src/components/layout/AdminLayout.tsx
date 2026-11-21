import {
  HammerIcon,
  LayoutDashboardIcon,
  MessageSquareTextIcon,
  PackageIcon,
  ReceiptTextIcon,
  SettingsIcon,
  TagsIcon,
  UsersIcon,
} from 'lucide-react'

import { DashboardLayout, type DashboardNavItem } from '@/components/layout/DashboardLayout'

const ADMIN_NAV: DashboardNavItem[] = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboardIcon, end: true },
  { to: '/admin/artisans', label: 'Artisans', icon: HammerIcon },
  { to: '/admin/clients', label: 'Clients', icon: UsersIcon },
  { to: '/admin/produits', label: 'Produits', icon: PackageIcon },
  { to: '/admin/categories', label: 'Catégories', icon: TagsIcon },
  { to: '/admin/commandes', label: 'Commandes', icon: ReceiptTextIcon },
  { to: '/admin/avis', label: 'Avis', icon: MessageSquareTextIcon },
  { to: '/admin/parametres', label: 'Paramètres', icon: SettingsIcon },
]

export function AdminLayout() {
  return <DashboardLayout title="Administration" homePath="/admin" navItems={ADMIN_NAV} />
}
