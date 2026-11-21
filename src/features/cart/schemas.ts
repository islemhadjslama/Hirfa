import { z } from 'zod'

import { GOVERNORATES } from '@/lib/constants'

/** PAN-4 — Adresse de livraison. */
export const checkoutSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Indiquez le nom du destinataire.')
    .max(100, 'Nom trop long (100 caractères maximum).'),
  phone: z
    .string()
    .trim()
    .regex(/^(\d[\s.-]?){7}\d$/, 'Numéro tunisien à 8 chiffres (ex. 22 123 456).'),
  governorate: z
    .string()
    .refine(
      (value) => (GOVERNORATES as readonly string[]).includes(value),
      'Choisissez un gouvernorat.',
    ),
  city: z.string().trim().min(2, 'Indiquez la ville.').max(80, 'Nom de ville trop long.'),
  address: z
    .string()
    .trim()
    .min(5, 'Indiquez une adresse complète (rue, numéro…).')
    .max(200, 'Adresse trop longue (200 caractères maximum).'),
  notes: z.string().trim().max(500, 'Note trop longue (500 caractères maximum).'),
})

export type CheckoutValues = z.infer<typeof checkoutSchema>
