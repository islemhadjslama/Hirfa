import {
  LayoutDashboardIcon,
  MessageSquareTextIcon,
  PackageIcon,
  ReceiptTextIcon,
  StoreIcon,
} from 'lucide-react'

import { DashboardLayout, type DashboardNavItem } from '@/components/layout/DashboardLayout'

const ARTISAN_NAV: DashboardNavItem[] = [
  { to: '/artisan', label: 'Tableau de bord', icon: LayoutDashboardIcon, end: true },
  { to: '/artisan/boutique', label: 'Ma boutique', icon: StoreIcon },
  { to: '/artisan/produits', label: 'Mes produits', icon: PackageIcon },
  { to: '/artisan/commandes', label: 'Commandes', icon: ReceiptTextIcon },
  { to: '/artisan/avis', label: 'Avis reçus', icon: MessageSquareTextIcon },
]

export function ArtisanLayout() {
  return <DashboardLayout title="Espace artisan" homePath="/artisan" navItems={ARTISAN_NAV} />
}
