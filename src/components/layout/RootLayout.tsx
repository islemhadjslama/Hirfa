import { useEffect, useRef } from 'react'
import { Outlet, ScrollRestoration, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { signOut } from '@/features/auth/api'
import { DEACTIVATED_MESSAGE } from '@/features/auth/redirects'
import { useProfile } from '@/hooks/useProfile'

/**
 * AUTH-6 : dès que le profil chargé indique un compte désactivé (à la
 * connexion ou lors d'un rafraîchissement), l'utilisateur est déconnecté.
 */
function useDeactivatedAccountLogout() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const handling = useRef(false)

  useEffect(() => {
    if (!profile || profile.is_active || handling.current) return
    handling.current = true
    void signOut().finally(() => {
      toast.error(DEACTIVATED_MESSAGE, { duration: 10_000 })
      navigate('/connexion', { replace: true })
      handling.current = false
    })
  }, [profile, navigate])
}

/** Racine de toutes les routes. */
export function RootLayout() {
  useDeactivatedAccountLogout()
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  )
}
