import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'

import { supabase } from '@/lib/supabase'

type AuthState = {
  session: Session | null
  /** `true` dès que Supabase a restauré (ou non) la session au démarrage. */
  initialized: boolean
}

export const useAuthStore = create<AuthState>()(() => ({
  session: null,
  initialized: false,
}))

let started = false

/** Branche le store sur Supabase Auth. Appelé une seule fois dans main.tsx. */
export function initAuth() {
  if (started) return
  started = true
  // INITIAL_SESSION est émis après la restauration de la session (et le
  // traitement d'un éventuel lien de récupération de mot de passe).
  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.setState({ session, initialized: true })
  })
}
