import { z } from 'zod'

import { GOVERNORATES } from '@/lib/constants'

const email = z
  .string()
  .trim()
  .min(1, 'L’adresse email est obligatoire.')
  .pipe(z.email('Adresse email invalide.'))

const fullName = z
  .string()
  .trim()
  .min(2, 'Indiquez votre nom complet.')
  .max(100, 'Nom trop long (100 caractères maximum).')

/** Téléphone tunisien : 8 chiffres, espaces, points ou tirets tolérés. */
const phone = z
  .string()
  .trim()
  .regex(/^(\d[\s.-]?){7}\d$/, 'Numéro tunisien à 8 chiffres (ex. 22 123 456).')

const password = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
  .max(72, 'Mot de passe trop long (72 caractères maximum).')

const passwordsMatch = {
  message: 'Les mots de passe ne correspondent pas.',
  path: ['confirmPassword'],
}

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Le mot de passe est obligatoire.'),
})

export const registerClientSchema = z
  .object({
    fullName,
    email,
    phone,
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, passwordsMatch)

export const registerArtisanSchema = z
  .object({
    fullName,
    email,
    phone,
    shopName: z
      .string()
      .trim()
      .min(2, 'Indiquez le nom de votre boutique.')
      .max(80, 'Nom de boutique trop long (80 caractères maximum).'),
    specialtyCategoryId: z.string().min(1, 'Choisissez votre spécialité.'),
    governorate: z
      .string()
      .refine(
        (value) => (GOVERNORATES as readonly string[]).includes(value),
        'Choisissez votre gouvernorat.',
      ),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, passwordsMatch)

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, passwordsMatch)

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterClientValues = z.infer<typeof registerClientSchema>
export type RegisterArtisanValues = z.infer<typeof registerArtisanSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

/** « 22 123 456 » → « 22123456 » */
export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '')
}
