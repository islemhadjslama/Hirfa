import { z } from 'zod'

import { GOVERNORATES } from '@/lib/constants'

/** CLI-1 — Profil et adresse de livraison par défaut (adresse facultative). */
export const accountSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Indiquez votre nom complet.')
    .max(100, 'Nom trop long (100 caractères maximum).'),
  phone: z
    .string()
    .trim()
    .regex(/^(\d[\s.-]?){7}\d$/, 'Numéro tunisien à 8 chiffres (ex. 22 123 456).'),
  governorate: z
    .string()
    .refine(
      (value) => value === '' || (GOVERNORATES as readonly string[]).includes(value),
      'Choisissez un gouvernorat.',
    ),
  city: z.string().trim().max(80, 'Nom de ville trop long.'),
  address: z.string().trim().max(200, 'Adresse trop longue (200 caractères maximum).'),
})

export type AccountValues = z.infer<typeof accountSchema>

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Indiquez votre mot de passe actuel.'),
    newPassword: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
      .max(72, 'Mot de passe trop long (72 caractères maximum).'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Le nouveau mot de passe doit être différent de l’actuel.',
    path: ['newPassword'],
  })

export type PasswordValues = z.infer<typeof passwordSchema>
