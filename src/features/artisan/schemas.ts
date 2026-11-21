import { z } from 'zod'

import { GOVERNORATES } from '@/lib/constants'

const governorate = z
  .string()
  .refine(
    (value) => (GOVERNORATES as readonly string[]).includes(value),
    'Choisissez votre gouvernorat.',
  )

const optionalUrl = z
  .string()
  .trim()
  .max(300, 'Lien trop long.')
  .refine(
    (value) => value === '' || /^https?:\/\/[^\s]+\.[^\s]+$/.test(value),
    'Lien invalide : il doit commencer par https://',
  )

// -----------------------------------------------------------------------------
// Boutique (ART-2)
// -----------------------------------------------------------------------------

export const shopSchema = z.object({
  shopName: z
    .string()
    .trim()
    .min(2, 'Indiquez le nom de votre boutique.')
    .max(80, 'Nom de boutique trop long (80 caractères maximum).'),
  bio: z.string().trim().max(1500, 'Présentation trop longue (1 500 caractères maximum).'),
  specialtyCategoryId: z.string().min(1, 'Choisissez votre spécialité.'),
  governorate,
  city: z.string().trim().max(80, 'Nom de ville trop long.'),
  address: z.string().trim().max(200, 'Adresse trop longue.'),
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  whatsapp: z
    .string()
    .trim()
    .refine((value) => {
      if (value === '') return true
      const digits = value.replace(/\D/g, '')
      return /^[+\d\s.-]+$/.test(value) && (digits.length === 8 || digits.length === 11)
    }, 'Numéro WhatsApp invalide (ex. 22 123 456 ou +216 22 123 456).'),
})

export type ShopValues = z.infer<typeof shopSchema>

/** WhatsApp stocké au format international sans « + » (ex. 21622123456), prêt pour wa.me. */
export function normalizeWhatsapp(value: string): string | null {
  const digits = value.replace(/\D/g, '')
  if (digits === '') return null
  return digits.length === 8 ? `216${digits}` : digits
}

/** Format d'affichage : « 21622123456 » → « +216 22 123 456 ». */
export function formatWhatsapp(value: string | null): string {
  if (!value) return ''
  const local = value.startsWith('216') ? value.slice(3) : value
  return local.length === 8
    ? `+216 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`
    : `+${value}`
}

// -----------------------------------------------------------------------------
// Produit (ART-4)
// -----------------------------------------------------------------------------

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Le nom doit contenir au moins 3 caractères.')
    .max(120, 'Nom trop long (120 caractères maximum).'),
  description: z
    .string()
    .trim()
    .min(10, 'Décrivez votre produit (10 caractères minimum).')
    .max(3000, 'Description trop longue (3 000 caractères maximum).'),
  categoryId: z.string().min(1, 'Choisissez une catégorie.'),
  price: z
    .string()
    .trim()
    .regex(/^\d{1,7}([.,]\d{1,3})?$/, 'Prix invalide (ex. 45 ou 45,500).')
    .refine((value) => parsePrice(value) > 0, 'Le prix doit être supérieur à 0.'),
  stock: z
    .string()
    .trim()
    .regex(/^\d{1,6}$/, 'Le stock doit être un nombre entier (0 ou plus).'),
  status: z.enum(['draft', 'published']),
})

export type ProductValues = z.infer<typeof productSchema>

/** « 45,500 » → 45.5 */
export function parsePrice(value: string): number {
  return Number(value.trim().replace(',', '.'))
}

/** 45.5 → « 45,500 » (pour pré-remplir le formulaire). */
export function priceToInput(value: number): string {
  return value.toFixed(3).replace('.', ',')
}
