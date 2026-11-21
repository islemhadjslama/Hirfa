/**
 * Données de démonstration Hirfa — `npm run seed` (cahier des charges §10).
 *
 * - Utilise la clé SECRÈTE (SUPABASE_SECRET_KEY, jamais exposée au frontend)
 *   pour créer les comptes, les boutiques, les produits et les images.
 * - Les commandes et les avis passent par les vraies règles métier : le script
 *   se connecte en tant que client (place_order, avis) puis en tant qu'artisan
 *   (update_sub_order_status), avec la clé publishable.
 * - Idempotent : relancer le script ne crée pas de doublons.
 * - Images générées localement (scripts/placeholder-png.ts), aucun téléchargement.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { Database } from '../src/types/database.ts'
import { PALETTE, placeholderPng, type Pattern } from './placeholder-png.ts'

type Db = SupabaseClient<Database>
type SubOrderStatus = Database['public']['Enums']['sub_order_status']

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------
try {
  process.loadEnvFile('.env.local')
} catch {
  // Variables déjà présentes dans l'environnement (CI…)
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY
if (!SUPABASE_URL || !PUBLISHABLE_KEY || !SECRET_KEY) {
  console.error(
    '✘ Variables manquantes : VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY et SUPABASE_SECRET_KEY (dans .env.local).',
  )
  process.exit(1)
}

const PASSWORD = 'Hirfa2026!'
const IMAGES_DIR = join(import.meta.dirname, 'seed-images')
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } }
const service: Db = createClient<Database>(SUPABASE_URL, SECRET_KEY, clientOptions)

const log = (message: string) => console.log(`  ${message}`)
const step = (title: string) => console.log(`\n▸ ${title}`)

function fail(context: string, error: { message: string } | null): never {
  console.error(`✘ ${context} : ${error?.message ?? 'erreur inconnue'}`)
  process.exit(1)
}

// -----------------------------------------------------------------------------
// Données
// -----------------------------------------------------------------------------
type ProductSeed = {
  name: string
  description: string
  price: number
  stock: number
  category: string
  featured?: boolean
  draft?: boolean
}

type ArtisanSeed = {
  email: string
  fullName: string
  phone: string
  shopName: string
  specialty: string
  governorate: string
  city: string
  bio: string
  whatsapp: string | null
  facebook: string | null
  status: 'approved' | 'pending'
  pattern: Pattern
  colors: [number, number, number]
  products: ProductSeed[]
}

const ARTISANS: ArtisanSeed[] = [
  {
    email: 'artisan1@hirfa.tn',
    fullName: 'Ali Ben Salah',
    phone: '22111222',
    shopName: 'Dar El Fekhar',
    specialty: 'poterie-ceramique',
    governorate: 'Nabeul',
    city: 'Nabeul',
    bio: 'Potier à Nabeul depuis trois générations. Je tourne et j’émaille chaque pièce à la main, avec les motifs traditionnels du Cap Bon.',
    whatsapp: '21622111222',
    facebook: 'https://facebook.com/darelfekhar',
    status: 'approved',
    pattern: 'zellige',
    colors: [0, 5, 2],
    products: [
      {
        name: 'Jarre émaillée de Nabeul',
        description: 'Grande jarre tournée à la main, émail vert et jaune. Hauteur 40 cm.',
        price: 85,
        stock: 4,
        category: 'poterie-ceramique',
        featured: true,
      },
      {
        name: 'Plat à couscous décoré',
        description:
          'Plat creux en terre cuite émaillée, motifs floraux peints à la main. Diamètre 35 cm.',
        price: 48.5,
        stock: 10,
        category: 'poterie-ceramique',
        featured: true,
      },
      {
        name: 'Set de 6 bols à harissa',
        description: 'Six petits bols colorés, parfaits pour la harissa ou les olives.',
        price: 36,
        stock: 15,
        category: 'poterie-ceramique',
      },
      {
        name: 'Tajine en terre cuite',
        description: 'Tajine de cuisson en terre naturelle, utilisable sur le feu.',
        price: 42,
        stock: 0,
        category: 'poterie-ceramique',
      },
      {
        name: 'Vase bleu de Sidi Bou Saïd',
        description: 'Vase élancé aux tons bleu et blanc. Hauteur 30 cm.',
        price: 55,
        stock: 6,
        category: 'decoration',
      },
      {
        name: 'Carreaux de zellige (lot de 12)',
        description: 'Carreaux émaillés 10 × 10 cm pour crédence ou table basse.',
        price: 64.75,
        stock: 8,
        category: 'decoration',
      },
      {
        name: 'Lampe en céramique ajourée',
        description: 'Lampe à poser ajourée, projette des motifs lumineux au mur.',
        price: 120,
        stock: 3,
        category: 'decoration',
      },
      {
        name: 'Pichet à eau « gargoulette »',
        description: 'Gargoulette traditionnelle qui garde l’eau fraîche.',
        price: 28,
        stock: 12,
        category: 'poterie-ceramique',
        draft: true,
      },
    ],
  },
  {
    email: 'artisan2@hirfa.tn',
    fullName: 'Fatma Mansouri',
    phone: '22333444',
    shopName: 'Tissages de Kairouan',
    specialty: 'tapis-tissage',
    governorate: 'Kairouan',
    city: 'Kairouan',
    bio: 'Tisserande à Kairouan. Mes mergoums et klims sont tissés sur un métier traditionnel, en laine de pays teinte naturellement.',
    whatsapp: '21622333444',
    facebook: null,
    status: 'approved',
    pattern: 'kilim',
    colors: [0, 6, 3],
    products: [
      {
        name: 'Mergoum rouge et ocre',
        description: 'Tapis mergoum 120 × 180 cm, laine tissée à la main, motifs géométriques.',
        price: 450,
        stock: 2,
        category: 'tapis-tissage',
        featured: true,
      },
      {
        name: 'Klim berbère',
        description: 'Klim léger 100 × 150 cm, idéal en descente de lit.',
        price: 280,
        stock: 3,
        category: 'tapis-tissage',
      },
      {
        name: 'Coussin en kilim',
        description: 'Housse de coussin 45 × 45 cm taillée dans un kilim, garnissage inclus.',
        price: 65,
        stock: 10,
        category: 'tapis-tissage',
        featured: true,
      },
      {
        name: 'Tapis de prière',
        description: 'Petit tapis 70 × 110 cm aux couleurs douces.',
        price: 120,
        stock: 5,
        category: 'tapis-tissage',
      },
      {
        name: 'Fouta en coton tissé',
        description: 'Fouta de plage ou de hammam, coton tissé à la main, franges nouées.',
        price: 39,
        stock: 20,
        category: 'broderie-textile',
      },
      {
        name: 'Plaid en laine de pays',
        description: 'Plaid chaud 130 × 170 cm, laine non traitée.',
        price: 160,
        stock: 4,
        category: 'broderie-textile',
      },
      {
        name: 'Sac cabas en kilim',
        description: 'Cabas doublé, anses en cuir, chutes de kilim recyclées.',
        price: 89,
        stock: 7,
        category: 'cuir-maroquinerie',
      },
      {
        name: 'Chemin de table brodé',
        description: 'Chemin de table 40 × 150 cm brodé de motifs kairouanais.',
        price: 58,
        stock: 9,
        category: 'broderie-textile',
      },
    ],
  },
  {
    email: 'artisan3@hirfa.tn',
    fullName: 'Youssef Haddad',
    phone: '22555666',
    shopName: 'Fidha Djerba',
    specialty: 'bijoux',
    governorate: 'Médenine',
    city: 'Houmt Souk (Djerba)',
    bio: 'Bijoutier à Houmt Souk. Je travaille l’argent selon les techniques djerbiennes : filigrane, ciselure et émail.',
    whatsapp: '21622555666',
    facebook: 'https://facebook.com/fidhadjerba',
    status: 'approved',
    pattern: 'circles',
    colors: [2, 5, 3],
    products: [
      {
        name: 'Khomsa en argent filigrané',
        description: 'Pendentif main de Fatma, argent 925 travaillé en filigrane. Chaîne incluse.',
        price: 95,
        stock: 8,
        category: 'bijoux',
        featured: true,
      },
      {
        name: 'Boucles d’oreilles djerbiennes',
        description: 'Pendants en argent et émail bleu, fermoir crochet.',
        price: 75,
        stock: 10,
        category: 'bijoux',
      },
      {
        name: 'Bracelet berbère ciselé',
        description: 'Bracelet jonc en argent ciselé, taille ajustable.',
        price: 130,
        stock: 5,
        category: 'bijoux',
      },
      {
        name: 'Fibule « khlel »',
        description: 'Fibule traditionnelle en argent, à porter en broche.',
        price: 110,
        stock: 3,
        category: 'bijoux',
      },
      {
        name: 'Collier de corail',
        description: 'Collier de perles de corail et d’argent, longueur 45 cm.',
        price: 185,
        stock: 2,
        category: 'bijoux',
      },
      {
        name: 'Bague en argent et ambre',
        description: 'Bague sertie d’ambre, taille sur demande.',
        price: 68,
        stock: 6,
        category: 'bijoux',
      },
      {
        name: 'Plateau en cuivre ciselé',
        description: 'Plateau rond 40 cm en cuivre martelé et ciselé.',
        price: 145,
        stock: 4,
        category: 'cuivre-dinanderie',
      },
    ],
  },
  {
    email: 'artisan4@hirfa.tn',
    fullName: 'Mehdi Jaziri',
    phone: '22777888',
    shopName: 'Jeld Tunis',
    specialty: 'cuir-maroquinerie',
    governorate: 'Tunis',
    city: 'Tunis (Médina)',
    bio: 'Maroquinier dans le souk Ech-Chaouachia. Cuir tanné végétal, coutures sellier à la main.',
    whatsapp: null,
    facebook: 'https://facebook.com/jeldtunis',
    status: 'approved',
    pattern: 'stripes',
    colors: [4, 3, 6],
    products: [
      {
        name: 'Sacoche en cuir naturel',
        description: 'Sacoche bandoulière en cuir tanné végétal, coutures sellier.',
        price: 210,
        stock: 4,
        category: 'cuir-maroquinerie',
        featured: true,
      },
      {
        name: 'Babouches brodées',
        description: 'Babouches en cuir souple brodées de fil doré. Pointures 36 à 45.',
        price: 65,
        stock: 12,
        category: 'cuir-maroquinerie',
      },
      {
        name: 'Portefeuille cousu main',
        description: 'Portefeuille 6 cartes, cuir pleine fleur.',
        price: 75,
        stock: 9,
        category: 'cuir-maroquinerie',
      },
      {
        name: 'Ceinture tressée',
        description: 'Ceinture en cuir tressé, boucle laiton.',
        price: 55,
        stock: 7,
        category: 'cuir-maroquinerie',
      },
      {
        name: 'Pouf en cuir',
        description: 'Pouf rond en cuir brodé, livré non rembourré.',
        price: 140,
        stock: 3,
        category: 'decoration',
      },
      {
        name: 'Savon à l’huile d’olive',
        description: 'Savon saponifié à froid, huile d’olive de Sfax et romarin. 120 g.',
        price: 9.5,
        stock: 50,
        category: 'savons-cosmetiques-naturels',
      },
      {
        name: 'Planche à découper en olivier',
        description: 'Planche en bois d’olivier massif, finition huile alimentaire.',
        price: 48,
        stock: 10,
        category: 'bois-olivier',
      },
    ],
  },
  {
    email: 'artisan5@hirfa.tn',
    fullName: 'Salma Triki',
    phone: '22999000',
    shopName: 'Atelier Zitouna',
    specialty: 'bois-olivier',
    governorate: 'Sfax',
    city: 'Sfax',
    bio: 'Sculptrice sur bois d’olivier. Boutique en attente de validation.',
    whatsapp: null,
    facebook: null,
    status: 'pending',
    pattern: 'checker',
    colors: [1, 5, 4],
    products: [],
  },
]

const CLIENTS = [
  {
    email: 'client1@hirfa.tn',
    fullName: 'Amira Ben Salah',
    phone: '98123456',
    governorate: 'Tunis',
    city: 'La Marsa',
    address: '12 rue des Jasmins',
  },
  {
    email: 'client2@hirfa.tn',
    fullName: 'Karim Bouazizi',
    phone: '98234567',
    governorate: 'Sousse',
    city: 'Sousse',
    address: '5 avenue Habib Bourguiba',
  },
  {
    email: 'client3@hirfa.tn',
    fullName: 'Yasmine Gharbi',
    phone: '98345678',
    governorate: 'Sfax',
    city: 'Sfax',
    address: '27 rue Mongi Slim',
  },
]

// -----------------------------------------------------------------------------
// Outils
// -----------------------------------------------------------------------------

/** Crée le compte s'il n'existe pas (email confirmé) et retourne son id. */
async function ensureUser(email: string, metadata: Record<string, string>): Promise<string> {
  for (let page = 1; ; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) fail('liste des utilisateurs', error)
    const found = data.users.find((user) => user.email === email)
    if (found) return found.id
    if (data.users.length < 1000) break
  }
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: metadata,
  })
  if (error || !data.user) fail(`création de ${email}`, error)
  log(`compte créé : ${email}`)
  return data.user.id
}

/** Génère (et garde une copie locale de) l'image, puis l'envoie dans Storage. */
async function uploadPng(
  bucket: 'product-images' | 'shop-assets',
  path: string,
  png: Buffer,
): Promise<void> {
  const local = join(IMAGES_DIR, bucket, path)
  mkdirSync(join(local, '..'), { recursive: true })
  writeFileSync(local, png)
  const { error } = await service.storage
    .from(bucket)
    .upload(path, png, { contentType: 'image/png', upsert: true })
  if (error) fail(`envoi de l’image ${bucket}/${path}`, error)
}

const color = (index: number) => PALETTE[index % PALETTE.length]

/** Client Supabase connecté avec un compte de démonstration (règles métier réelles). */
async function signedIn(email: string): Promise<Db> {
  const db = createClient<Database>(
    SUPABASE_URL as string,
    PUBLISHABLE_KEY as string,
    clientOptions,
  )
  const { error } = await db.auth.signInWithPassword({ email, password: PASSWORD })
  if (error) fail(`connexion de ${email}`, error)
  return db
}

// -----------------------------------------------------------------------------
// Script
// -----------------------------------------------------------------------------
console.log('Hirfa — données de démonstration')

step('Catégories')
const { data: categories, error: categoriesError } = await service
  .from('categories')
  .select('id, slug')
if (categoriesError) fail('lecture des catégories', categoriesError)
const categoryId = new Map(categories.map((c) => [c.slug, c.id]))
if (categoryId.size < 11)
  fail('catégories', { message: 'lancez d’abord `npm run db:push` (seed.sql)' })
log(`${categoryId.size} catégories trouvées`)

step('Administrateur')
const adminId = await ensureUser('admin@hirfa.tn', {
  role: 'client',
  full_name: 'Administration Hirfa',
})
{
  // La clé secrète contourne la protection RM-9 : c'est le seul moyen d'obtenir le rôle admin
  const { error } = await service.from('profiles').update({ role: 'admin' }).eq('id', adminId)
  if (error) fail('rôle admin', error)
  log('admin@hirfa.tn → admin')
}

step('Artisans et boutiques')
const artisanIds = new Map<string, string>()
for (const seed of ARTISANS) {
  const id = await ensureUser(seed.email, {
    role: 'artisan',
    full_name: seed.fullName,
    phone: seed.phone,
    shop_name: seed.shopName,
    specialty_category_id: String(categoryId.get(seed.specialty)),
    governorate: seed.governorate,
  })
  artisanIds.set(seed.email, id)

  await uploadPng(
    'shop-assets',
    `${id}/logo.png`,
    placeholderPng(
      seed.pattern,
      [color(seed.colors[0]), color(seed.colors[1]), color(seed.colors[2])],
      300,
    ),
  )
  await uploadPng(
    'shop-assets',
    `${id}/banniere.png`,
    placeholderPng(
      seed.pattern,
      [color(seed.colors[1]), color(seed.colors[0]), color(seed.colors[2])],
      1200,
      400,
    ),
  )
  const logoUrl = service.storage.from('shop-assets').getPublicUrl(`${id}/logo.png`).data.publicUrl
  const bannerUrl = service.storage.from('shop-assets').getPublicUrl(`${id}/banniere.png`)
    .data.publicUrl

  const { error } = await service
    .from('artisan_profiles')
    .update({
      shop_name: seed.shopName,
      bio: seed.bio,
      city: seed.city,
      governorate: seed.governorate,
      specialty_category_id: categoryId.get(seed.specialty) ?? null,
      whatsapp: seed.whatsapp,
      facebook_url: seed.facebook,
      logo_url: logoUrl,
      banner_url: bannerUrl,
      status: seed.status,
    })
    .eq('id', id)
  if (error) fail(`boutique ${seed.shopName}`, error)
  await service.from('profiles').update({ phone: seed.phone }).eq('id', id)
  log(`${seed.shopName} (${seed.status === 'approved' ? 'approuvée' : 'en attente'})`)
}

step('Clients')
const clientIds = new Map<string, string>()
for (const seed of CLIENTS) {
  const id = await ensureUser(seed.email, {
    role: 'client',
    full_name: seed.fullName,
    phone: seed.phone,
  })
  clientIds.set(seed.email, id)
  const { error } = await service
    .from('profiles')
    .update({ governorate: seed.governorate, city: seed.city, address: seed.address })
    .eq('id', id)
  if (error) fail(`profil ${seed.email}`, error)
  log(seed.email)
}

step('Produits et images')
const productIds = new Map<string, number>()
let created = 0
for (const [artisanIndex, seed] of ARTISANS.entries()) {
  const artisanId = artisanIds.get(seed.email) as string
  for (const [index, product] of seed.products.entries()) {
    const { data: existing } = await service
      .from('products')
      .select('id')
      .eq('artisan_id', artisanId)
      .eq('name', product.name)
      .maybeSingle()
    let id = existing?.id
    if (!id) {
      const { data, error } = await service
        .from('products')
        .insert({
          artisan_id: artisanId,
          category_id: categoryId.get(product.category) as number,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          status: product.draft ? 'draft' : 'published',
          is_featured: product.featured ?? false,
          slug: '', // généré par le trigger
        })
        .select('id')
        .single()
      if (error) fail(`produit ${product.name}`, error)
      id = data.id
      created++
    }
    productIds.set(product.name, id)

    const { count } = await service
      .from('product_images')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', id)
    if (!count) {
      const patterns: Pattern[] = ['zellige', 'stripes', 'checker', 'circles', 'kilim']
      for (let n = 0; n < 2; n++) {
        const path = `${artisanId}/${id}/${n + 1}.png`
        const png = placeholderPng(patterns[(index + n + artisanIndex) % patterns.length], [
          color(index + artisanIndex + n),
          color(seed.colors[1]),
          color(index + 3 + n),
        ])
        await uploadPng('product-images', path, png)
        const { error } = await service
          .from('product_images')
          .insert({ product_id: id, path, position: n })
        if (error) fail(`image de ${product.name}`, error)
      }
    }
  }
}
log(`${productIds.size} produits (${created} créés), 2 images chacun`)

step('Commandes (via place_order) et suivi (via update_sub_order_status)')
const demoClientIds = [...clientIds.values()]
const { count: existingOrders } = await service
  .from('orders')
  .select('id', { count: 'exact', head: true })
  .in('client_id', demoClientIds)

type OrderPlan = {
  client: string
  monthsAgo: number
  items: { product: string; quantity: number }[]
  /** Statut final de la sous-commande de chaque artisan concerné. */
  statuses: Record<string, SubOrderStatus>
  cancelReason?: string
}

const ORDERS: OrderPlan[] = [
  {
    client: 'client1@hirfa.tn',
    monthsAgo: 4,
    items: [
      { product: 'Plat à couscous décoré', quantity: 1 },
      { product: 'Coussin en kilim', quantity: 2 },
    ],
    statuses: { 'artisan1@hirfa.tn': 'delivered', 'artisan2@hirfa.tn': 'delivered' },
  },
  {
    client: 'client2@hirfa.tn',
    monthsAgo: 3,
    items: [
      { product: 'Khomsa en argent filigrané', quantity: 1 },
      { product: 'Boucles d’oreilles djerbiennes', quantity: 1 },
    ],
    statuses: { 'artisan3@hirfa.tn': 'delivered' },
  },
  {
    client: 'client3@hirfa.tn',
    monthsAgo: 2,
    items: [
      { product: 'Sacoche en cuir naturel', quantity: 1 },
      { product: 'Jarre émaillée de Nabeul', quantity: 1 },
    ],
    statuses: { 'artisan4@hirfa.tn': 'delivered', 'artisan1@hirfa.tn': 'cancelled' },
    cancelReason: 'Jarre fêlée à la cuisson, désolé !',
  },
  {
    client: 'client1@hirfa.tn',
    monthsAgo: 1,
    items: [{ product: 'Mergoum rouge et ocre', quantity: 1 }],
    statuses: { 'artisan2@hirfa.tn': 'shipped' },
  },
  {
    client: 'client2@hirfa.tn',
    monthsAgo: 0,
    items: [
      { product: 'Set de 6 bols à harissa', quantity: 2 },
      { product: 'Babouches brodées', quantity: 1 },
    ],
    statuses: { 'artisan1@hirfa.tn': 'confirmed', 'artisan4@hirfa.tn': 'pending' },
  },
  {
    client: 'client3@hirfa.tn',
    monthsAgo: 0,
    items: [{ product: 'Bracelet berbère ciselé', quantity: 1 }],
    statuses: { 'artisan3@hirfa.tn': 'pending' },
  },
]
const FLOW: SubOrderStatus[] = ['confirmed', 'preparing', 'shipped', 'delivered']

if (existingOrders && existingOrders > 0) {
  log(`${existingOrders} commande(s) déjà présentes : étape ignorée`)
} else {
  const sessions = new Map<string, Db>()
  const session = async (email: string) => {
    if (!sessions.has(email)) sessions.set(email, await signedIn(email))
    return sessions.get(email) as Db
  }

  for (const plan of ORDERS) {
    const clientSeed = CLIENTS.find((c) => c.email === plan.client)!
    const db = await session(plan.client)
    const { data: orderId, error } = await db.rpc('place_order', {
      p_items: plan.items.map((item) => ({
        product_id: productIds.get(item.product) as number,
        quantity: item.quantity,
      })),
      p_shipping: {
        full_name: clientSeed.fullName,
        phone: clientSeed.phone,
        governorate: clientSeed.governorate,
        city: clientSeed.city,
        address: clientSeed.address,
        notes: plan.monthsAgo === 0 ? 'Merci d’appeler avant de livrer.' : '',
      },
    })
    if (error) fail(`commande de ${plan.client}`, error)

    // Faire avancer chaque sous-commande en tant que son artisan
    const { data: subs } = await service
      .from('sub_orders')
      .select('id, artisan_id')
      .eq('order_id', orderId)
    for (const sub of subs ?? []) {
      const artisanEmail = [...artisanIds.entries()].find(([, id]) => id === sub.artisan_id)?.[0]
      const target = artisanEmail ? plan.statuses[artisanEmail] : undefined
      if (!artisanEmail || !target || target === 'pending') continue
      const artisanDb = await session(artisanEmail)
      const steps =
        target === 'cancelled'
          ? (['cancelled'] as SubOrderStatus[])
          : FLOW.slice(0, FLOW.indexOf(target) + 1)
      for (const status of steps) {
        const { error: statusError } = await artisanDb.rpc('update_sub_order_status', {
          p_sub_order_id: sub.id,
          p_status: status,
          p_note: status === 'cancelled' ? plan.cancelReason : undefined,
        })
        if (statusError) fail(`statut ${status}`, statusError)
      }
    }

    // Antidatage (clé secrète) pour remplir les graphiques des 6 derniers mois
    if (plan.monthsAgo > 0) {
      const date = new Date()
      date.setMonth(date.getMonth() - plan.monthsAgo, 10)
      date.setHours(10, 0, 0, 0)
      const iso = date.toISOString()
      await service.from('orders').update({ created_at: iso }).eq('id', orderId)
      for (const sub of subs ?? []) {
        await service.from('sub_orders').update({ created_at: iso }).eq('id', sub.id)
        const { data: history } = await service
          .from('sub_order_status_history')
          .select('id')
          .eq('sub_order_id', sub.id)
          .order('id')
        for (const [i, entry] of (history ?? []).entries()) {
          const when = new Date(date.getTime() + i * 26 * 3600 * 1000).toISOString()
          await service
            .from('sub_order_status_history')
            .update({ created_at: when })
            .eq('id', entry.id)
        }
      }
    }
    log(`commande de ${plan.client} (${Object.values(plan.statuses).join(', ')})`)
  }

  step('Avis (après livraison, via la RLS)')
  const REVIEWS = [
    {
      client: 'client1@hirfa.tn',
      product: 'Plat à couscous décoré',
      rating: 5,
      comment: 'Magnifique et très bien emballé. Les couleurs sont encore plus belles en vrai.',
    },
    {
      client: 'client1@hirfa.tn',
      product: 'Coussin en kilim',
      rating: 4,
      comment: 'Très beau travail, livraison un peu longue.',
    },
    {
      client: 'client2@hirfa.tn',
      product: 'Khomsa en argent filigrané',
      rating: 5,
      comment: 'Un bijou d’une grande finesse, merci !',
    },
    {
      client: 'client2@hirfa.tn',
      product: 'Boucles d’oreilles djerbiennes',
      rating: 4,
      comment: null,
    },
    {
      client: 'client3@hirfa.tn',
      product: 'Sacoche en cuir naturel',
      rating: 5,
      comment: 'Cuir superbe, coutures impeccables.',
    },
  ]
  for (const review of REVIEWS) {
    const db = await session(review.client)
    const { error } = await db.from('reviews').insert({
      product_id: productIds.get(review.product) as number,
      client_id: clientIds.get(review.client) as string,
      rating: review.rating,
      comment: review.comment,
    })
    if (error && error.code !== '23505') fail(`avis sur ${review.product}`, error)
  }
  log(`${REVIEWS.length} avis`)

  for (const db of sessions.values()) await db.auth.signOut()
}

console.log(`
✔ Terminé. Comptes de démonstration (mot de passe : ${PASSWORD}) :
    admin@hirfa.tn
    artisan1@hirfa.tn … artisan4@hirfa.tn (approuvés), artisan5@hirfa.tn (en attente)
    client1@hirfa.tn … client3@hirfa.tn
`)
