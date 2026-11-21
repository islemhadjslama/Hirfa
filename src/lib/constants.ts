/** Les 24 gouvernorats de Tunisie, par ordre alphabétique. */
export const GOVERNORATES = [
  'Ariana',
  'Béja',
  'Ben Arous',
  'Bizerte',
  'Gabès',
  'Gafsa',
  'Jendouba',
  'Kairouan',
  'Kasserine',
  'Kébili',
  'Le Kef',
  'Mahdia',
  'La Manouba',
  'Médenine',
  'Monastir',
  'Nabeul',
  'Sfax',
  'Sidi Bouzid',
  'Siliana',
  'Sousse',
  'Tataouine',
  'Tozeur',
  'Tunis',
  'Zaghouan',
] as const

export type Governorate = (typeof GOVERNORATES)[number]

export const PRODUCTS_PER_PAGE = 12
export const MAX_PRODUCT_IMAGES = 5
export const MAX_IMAGE_SIZE_MB = 2
export const CONTACT_EMAIL = 'contact@hirfa.tn'
