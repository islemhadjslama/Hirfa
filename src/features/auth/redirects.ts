import type { Profile } from '@/features/auth/api'

/** Page d'accueil de l'espace correspondant au rôle (AUTH-3). */
export function homePathFor(profile: Profile): string {
  switch (profile.role) {
    case 'admin':
      return '/admin'
    case 'artisan':
      return profile.artisan_profiles?.status === 'approved' ? '/artisan' : '/artisan/en-attente'
    default:
      return '/catalogue'
  }
}

/** N'accepte que les chemins internes (évite les redirections ouvertes). */
export function safeRedirect(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return null
  }
  return value
}

/** Après connexion : le client revient à la page précédente, les autres vont à leur espace. */
export function postLoginPath(profile: Profile, redirect: string | null): string {
  const target = safeRedirect(redirect)
  if (profile.role === 'client' && target) return target
  return homePathFor(profile)
}

export const DEACTIVATED_MESSAGE = 'Votre compte a été désactivé. Contactez l’administrateur.'
