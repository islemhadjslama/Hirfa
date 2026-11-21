import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type Profile = Tables<'profiles'> & {
  artisan_profiles: Tables<'artisan_profiles'> | null
}

// -----------------------------------------------------------------------------
// Profil de l'utilisateur connecté
// -----------------------------------------------------------------------------

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, artisan_profiles(*)')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export function profileQueryOptions(userId: string | undefined) {
  return queryOptions({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId as string),
    enabled: Boolean(userId),
    staleTime: 30_000,
    // AUTH-6 : un compte désactivé par l'admin est détecté rapidement.
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  })
}

// -----------------------------------------------------------------------------
// Connexion, inscription, mot de passe
// -----------------------------------------------------------------------------

export type SignInInput = { email: string; password: string }

export async function signIn({ email, password }: SignInInput) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
}

/** Métadonnées lues par le trigger `handle_new_user` (le rôle admin est refusé côté base). */
export type SignUpMetadata =
  | { role: 'client'; full_name: string; phone: string }
  | {
      role: 'artisan'
      full_name: string
      phone: string
      shop_name: string
      specialty_category_id: string
      governorate: string
    }

export type SignUpInput = { email: string; password: string; metadata: SignUpMetadata }

/** Retourne `needsEmailConfirmation: true` si Supabase exige la confirmation de l'email. */
export async function signUp({ email, password, metadata }: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/connexion`,
    },
  })
  if (error) throw error
  // Email déjà utilisé quand la confirmation est activée : Supabase renvoie un
  // utilisateur sans identité au lieu d'une erreur.
  if (data.user && data.user.identities?.length === 0) {
    throw new Error('Un compte existe déjà avec cet email.')
  }
  return { needsEmailConfirmation: !data.session }
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
  })
  if (error) throw error
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
  queryClient.clear()
}

export function useSignIn() {
  return useMutation({ mutationFn: signIn })
}

/**
 * `onSuccess` est passé au hook (et non à `mutate`) : après une inscription,
 * GuestOnlyRoute démonte la page pour rediriger, et les callbacks de `mutate`
 * ne seraient alors plus appelés.
 */
export function useSignUp(onSuccess?: (result: { needsEmailConfirmation: boolean }) => void) {
  return useMutation({ mutationFn: signUp, onSuccess })
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset })
}

export function useUpdatePassword() {
  return useMutation({ mutationFn: updatePassword })
}

// -----------------------------------------------------------------------------
// Artisan refusé : resoumettre la demande (rejected → pending, autorisé par RM-9)
// -----------------------------------------------------------------------------

export function useResubmitArtisan() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (artisanId: string) => {
      const { error } = await supabase
        .from('artisan_profiles')
        .update({ status: 'pending' })
        .eq('id', artisanId)
      if (error) throw error
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['profile'] }),
  })
}
