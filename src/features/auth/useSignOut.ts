import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { signOut } from '@/features/auth/api'

/** Déconnexion (AUTH-5) : retour à l'accueil avec un toast. */
export function useSignOut() {
  const navigate = useNavigate()
  return async () => {
    await signOut()
    toast.success('Vous êtes déconnecté.')
    navigate('/', { replace: true })
  }
}
