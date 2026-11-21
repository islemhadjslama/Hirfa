import {
  ClockIcon,
  LayoutDashboardIcon,
  MessageSquareTextIcon,
  PackageIcon,
  ReceiptTextIcon,
  StoreIcon,
} from 'lucide-react'

import { DashboardLayout, type DashboardNavItem } from '@/components/layout/DashboardLayout'
import { useProfile } from '@/hooks/useProfile'

const APPROVED_NAV: DashboardNavItem[] = [
  { to: '/artisan', label: 'Tableau de bord', icon: LayoutDashboardIcon, end: true },
  { to: '/artisan/boutique', label: 'Ma boutique', icon: StoreIcon },
  { to: '/artisan/produits', label: 'Mes produits', icon: PackageIcon },
  { to: '/artisan/commandes', label: 'Commandes', icon: ReceiptTextIcon },
  { to: '/artisan/avis', label: 'Avis reçus', icon: MessageSquareTextIcon },
]

// ART-1 : un artisan non approuvé n'accède qu'à son statut et à sa boutique.
const NOT_APPROVED_NAV: DashboardNavItem[] = [
  { to: '/artisan/en-attente', label: 'Statut du compte', icon: ClockIcon },
  { to: '/artisan/boutique', label: 'Ma boutique', icon: StoreIcon },
]

export function ArtisanLayout() {
  const { profile } = useProfile()
  const approved = profile?.artisan_profiles?.status === 'approved'

  return (
    <DashboardLayout
      title="Espace artisan"
      homePath={approved ? '/artisan' : '/artisan/en-attente'}
      navItems={approved ? APPROVED_NAV : NOT_APPROVED_NAV}
    />
  )
}
