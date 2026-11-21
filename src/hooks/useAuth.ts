import { useAuthStore } from '@/stores/auth'

/** Session Supabase courante. */
export function useAuth() {
  const session = useAuthStore((state) => state.session)
  const initialized = useAuthStore((state) => state.initialized)
  return { session, user: session?.user ?? null, initialized }
}
