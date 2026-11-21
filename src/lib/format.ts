const priceFormatter = new Intl.NumberFormat('fr-TN', {
  style: 'currency',
  currency: 'TND',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' })

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

/** Prix en dinars tunisiens, ex. `45,000 DT`. Accepte les `numeric` renvoyés en chaîne. */
export function formatPrice(value: number | string | null | undefined): string {
  const amount = typeof value === 'string' ? Number(value) : (value ?? 0)
  // Espace fine insécable (U+202F) → espace insécable classique : la police des titres
  // (Fraunces) n'a pas de glyphe pour U+202F et « 1 234 » s'afficherait « 1234 ».
  return priceFormatter.format(Number.isFinite(amount) ? amount : 0).replace(/\u202f/g, '\u00a0')
}

/** Date longue, ex. `21 novembre 2026`. */
export function formatDate(value: string | Date): string {
  return dateFormatter.format(typeof value === 'string' ? new Date(value) : value)
}

/** Date et heure courtes, ex. `21/11/2026 14:30`. */
export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(typeof value === 'string' ? new Date(value) : value)
}
