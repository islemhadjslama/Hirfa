import type { Profile } from '@/features/auth/api'
import { homePathFor } from '@/features/auth/redirects'

export type AccountLink = { to: string; label: string }

/** Liens du menu utilisateur selon le rôle. */
export function accountLinksFor(profile: Profile): AccountLink[] {
  switch (profile.role) {
    case 'admin':
      return [{ to: '/admin', label: 'Administration' }]
    case 'artisan':
      return [
        { to: homePathFor(profile), label: 'Mon espace artisan' },
        { to: '/artisan/boutique', label: 'Ma boutique' },
      ]
    default:
      return [
        { to: '/compte', label: 'Mon compte' },
        { to: '/compte/commandes', label: 'Mes commandes' },
        { to: '/compte/favoris', label: 'Mes favoris' },
      ]
  }
}

/** Prénom (premier mot du nom complet), pour l'affichage. */
export function firstName(profile: Profile): string {
  return profile.full_name.trim().split(/\s+/)[0] || 'Mon compte'
}
