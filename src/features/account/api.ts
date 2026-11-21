import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AuthError } from '@supabase/supabase-js'

import type { AccountValues } from '@/features/account/schemas'
import { normalizePhone } from '@/features/auth/schemas'
import { supabase } from '@/lib/supabase'

/** CLI-1 — Nom, téléphone et adresse de livraison par défaut. */
export function useUpdateAccount() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, values }: { userId: string; values: AccountValues }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.fullName,
          phone: normalizePhone(values.phone),
          governorate: values.governorate || null,
          city: values.city || null,
          address: values.address || null,
        })
        .eq('id', userId)
      if (error) throw error
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['profile'] }),
  })
}

/**
 * CLI-1 — Changement de mot de passe. Le mot de passe actuel est vérifié
 * d'abord (une session ouverte ne suffit pas à le changer).
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async ({
      email,
      currentPassword,
      newPassword,
    }: {
      email: string
      currentPassword: string
      newPassword: string
    }) => {
      const { error: checkError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })
      if (checkError instanceof AuthError && checkError.code === 'invalid_credentials') {
        throw new Error('Mot de passe actuel incorrect.')
      }
      if (checkError) throw checkError
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
    },
  })
}
