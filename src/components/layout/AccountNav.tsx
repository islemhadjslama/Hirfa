import { HeartIcon, PackageIcon, UserIcon } from 'lucide-react'
import { NavLink } from 'react-router'

import { cn } from '@/lib/utils'

const LINKS = [
  { to: '/compte', label: 'Mon profil', icon: UserIcon, end: true },
  { to: '/compte/commandes', label: 'Mes commandes', icon: PackageIcon, end: false },
  { to: '/compte/favoris', label: 'Mes favoris', icon: HeartIcon, end: true },
]

/** Onglets de l'espace client. */
export function AccountNav() {
  return (
    <nav aria-label="Mon compte" className="mb-6 overflow-x-auto border-b">
      <ul className="flex min-w-max gap-1">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  '-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
