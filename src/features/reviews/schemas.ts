import { z } from 'zod'

/** CLI-6 — Note de 1 à 5 + commentaire facultatif. */
export const reviewSchema = z.object({
  rating: z
    .number({ error: 'Choisissez une note de 1 à 5 étoiles.' })
    .int()
    .min(1, 'Choisissez une note de 1 à 5 étoiles.')
    .max(5, 'Choisissez une note de 1 à 5 étoiles.'),
  comment: z.string().trim().max(1000, 'Commentaire trop long (1 000 caractères maximum).'),
})

export type ReviewValues = z.infer<typeof reviewSchema>
