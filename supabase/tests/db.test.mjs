// Tests de la base Hirfa (migrations + seed + RLS + RPC + triggers).
// Exécute toutes les migrations dans PGlite (Postgres en WebAssembly, en mémoire),
// avec des bouchons minimaux pour les schémas Supabase `auth` et `storage`.
// Aucune connexion à Supabase n'est nécessaire.   →   npm run db:test
//
// Les utilisateurs sont simulés avec `set role authenticated|anon` et le
// paramètre `request.jwt.claim.sub` (lu par le bouchon de auth.uid()).

import { PGlite } from '@electric-sql/pglite'
import { unaccent } from '@electric-sql/pglite/contrib/unaccent'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.argv[2] ?? process.cwd()
const migDir = join(root, 'supabase', 'migrations')
const db = new PGlite({ extensions: { unaccent } })

// --- Bouchons Supabase -------------------------------------------------------
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth; create schema storage; create schema extensions;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$
    select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant usage on schema public, auth, storage, extensions to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated;
  grant all on storage.objects, storage.buckets to anon, authenticated, service_role;
  -- Comme un projet Supabase récent : AUCUN droit par défaut sur les objets de public
  -- (tables, séquences, fonctions). Les migrations doivent tout accorder explicitement.
  alter default privileges in schema public revoke execute on functions from public;
`)

for (const f of readdirSync(migDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()) {
  try {
    await db.exec(readFileSync(join(migDir, f), 'utf8'))
    console.log('✔ migration', f)
  } catch (e) {
    console.error('✘ migration', f, '\n ', e.message)
    process.exit(1)
  }
}
const seed = readFileSync(join(root, 'supabase', 'seed.sql'), 'utf8')
await db.exec(seed)
await db.exec(seed)
console.log('✔ seed.sql (joué 2 fois)')

// --- Outils de test -----------------------------------------------------------
let passed = 0,
  failed = 0
const ok = (cond, label) => {
  if (cond) {
    passed++
    console.log('  ✔', label)
  } else {
    failed++
    console.log('  ✘', label)
  }
}
const q = async (sql, params) => (await db.query(sql, params)).rows
async function as(uid, sql, params) {
  await db.exec(
    `set role ${uid ? 'authenticated' : 'anon'}; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false);`,
  )
  try {
    return (await db.query(sql, params)).rows
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`)
  }
}
async function fails(uid, sql, params, expected) {
  try {
    await as(uid, sql, params)
    return `PAS D'ERREUR`
  } catch (e) {
    return expected && !e.message.includes(expected) ? `mauvais message : ${e.message}` : true
  }
}
const expectFail = async (label, uid, sql, params, msg) => {
  const r = await fails(uid, sql, params, msg)
  ok(r === true, label + (r === true ? '' : ` → ${r}`))
}
// Écriture bloquée : refus de droit (GRANT) ou 0 ligne touchée (RLS).
async function blocked(uid, sql, params) {
  try {
    return (await as(uid, sql, params)).length === 0
  } catch {
    return true
  }
}
async function signup(email, meta) {
  return (
    await q(`insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`, [
      email,
      meta,
    ])
  )[0].id
}

console.log('\nCatégories & paramètres')
ok(
  (await q(`select count(*)::int n from categories`))[0].n === 11,
  '11 catégories, seed idempotent',
)
ok(
  Number((await q(`select shipping_fee from app_settings`))[0].shipping_fee) === 7,
  'frais de livraison 7,000',
)
ok(
  (await q(`select slugify('Bois d''olivier & Cœur')`))[0].slugify === 'bois-d-olivier-coeur',
  'slugify',
)

console.log('\nInscription (handle_new_user)')
const hacker = await signup('h@x.tn', { role: 'admin', full_name: 'Pirate' })
ok(
  (await q(`select role from profiles where id = $1`, [hacker]))[0].role === 'client',
  'role=admin dans les métadonnées → client',
)
const client1 = await signup('c1@x.tn', {
  role: 'client',
  full_name: 'Client Un',
  phone: '22123456',
})
const client2 = await signup('c2@x.tn', { full_name: 'Client Deux' })
const cat = (await q(`select id from categories where slug='poterie-ceramique'`))[0].id
const art1 = await signup('a1@x.tn', {
  role: 'artisan',
  full_name: 'Ali',
  shop_name: 'Dar El Fekhar',
  specialty_category_id: String(cat),
  governorate: 'Nabeul',
})
const art2 = await signup('a2@x.tn', {
  role: 'artisan',
  full_name: 'Sonia',
  shop_name: 'Dar El Fekhar',
})
const art3 = await signup('a3@x.tn', {
  role: 'artisan',
  full_name: 'Pending',
  shop_name: 'Atelier en attente',
})
const admin = await signup('admin@x.tn', { full_name: 'Admin' })
await q(`update profiles set role='admin' where id=$1`, [admin]) // comme dans le SQL Editor
const ap = await q(
  `select slug, status, specialty_category_id from artisan_profiles order by created_at, slug`,
)
ok(
  ap.some((a) => a.slug === 'dar-el-fekhar') && ap.some((a) => a.slug === 'dar-el-fekhar-2'),
  'slugs de boutique uniques (-2)',
)
ok(
  ap.every((a) => a.status === 'pending'),
  'artisans créés en pending',
)
ok(
  (await q(`select specialty_category_id from artisan_profiles where id=$1`, [art1]))[0]
    .specialty_category_id == cat,
  'spécialité enregistrée',
)

console.log('\nRM-9 : colonnes protégées')
await expectFail(
  'client ne peut pas se donner le rôle admin',
  client1,
  `update profiles set role='admin' where id=$1`,
  [client1],
  'rôle',
)
await expectFail(
  'client ne peut pas se réactiver',
  client1,
  `update profiles set is_active=false where id=$1`,
  [client1],
  'administrateur',
)
ok(
  (
    await as(client1, `update profiles set full_name='Client 1' where id=$1 returning full_name`, [
      client1,
    ])
  )[0]?.full_name === 'Client 1',
  'client modifie son nom',
)
ok(
  (await as(client1, `update profiles set full_name='X' where id=$1 returning id`, [client2]))
    .length === 0,
  "client ne modifie pas le profil d'un autre",
)
ok((await as(client1, `select * from profiles`)).length === 1, 'client ne lit que son profil')
await expectFail(
  "artisan ne s'auto-approuve pas",
  art1,
  `update artisan_profiles set status='approved' where id=$1`,
  [art1],
  'statut',
)

console.log('\nValidation admin')
await expectFail(
  'artisan pending ne crée pas de produit (RM-2)',
  art1,
  `insert into products (artisan_id, category_id, name, price, stock) values ($1,$2,'Jarre',45,3)`,
  [art1, cat],
)
await expectFail(
  'refus sans motif impossible',
  admin,
  `update artisan_profiles set status='rejected' where id=$1`,
  [art2],
  'motif',
)
await as(admin, `update artisan_profiles set status='approved' where id in ($1,$2)`, [art1, art2])
ok(
  (await q(`select approved_at from artisan_profiles where id=$1`, [art1]))[0].approved_at !== null,
  'approved_at renseigné',
)
await as(
  admin,
  `update artisan_profiles set status='rejected', rejection_reason='Photos floues' where id=$1`,
  [art3],
)
ok(
  (
    await as(
      art3,
      `update artisan_profiles set status='pending', bio='Nouvelles photos' where id=$1 returning status, rejection_reason`,
      [art3],
    )
  )[0]?.rejection_reason === null,
  'artisan refusé resoumet (rejected → pending), motif effacé',
)
await expectFail(
  'artisan pending ne repasse pas en approved',
  art3,
  `update artisan_profiles set status='approved' where id=$1`,
  [art3],
  'statut',
)

console.log('\nProduits')
await expectFail(
  'artisan ne met pas son produit en avant',
  art1,
  `insert into products (artisan_id, category_id, name, price, stock, is_featured) values ($1,$2,'Jarre',45,3,true)`,
  [art1, cat],
  'administrateur',
)
const p1 = (
  await as(
    art1,
    `insert into products (artisan_id, category_id, name, price, stock, status) values ($1,$2,'Jarre de Nabeul',45,3,'published') returning id, slug`,
    [art1, cat],
  )
)[0]
ok(/^jarre-de-nabeul-[0-9a-f]{6}$/.test(p1.slug), `slug produit généré (${p1.slug})`)
const p2 = (
  await as(
    art1,
    `insert into products (artisan_id, category_id, name, price, stock, status) values ($1,$2,'Plat',20,10,'published') returning id`,
    [art1, cat],
  )
)[0]
const p3 = (
  await as(
    art2,
    `insert into products (artisan_id, category_id, name, price, stock, status) values ($1,$2,'Tajine',30.5,5,'published') returning id`,
    [art2, cat],
  )
)[0]
const pDraft = (
  await as(
    art2,
    `insert into products (artisan_id, category_id, name, price, stock) values ($1,$2,'Brouillon',10,5) returning id`,
    [art2, cat],
  )
)[0]
await expectFail(
  'artisan ne crée pas de produit pour un autre',
  art1,
  `insert into products (artisan_id, category_id, name, price, stock) values ($1,$2,'X',1,1)`,
  [art2, cat],
)
ok(
  (await as(art1, `update products set price=1 where id=$1 returning id`, [p3.id])).length === 0,
  "artisan ne modifie pas le produit d'un autre",
)
await expectFail('prix ≤ 0 refusé (CHECK)', art1, `update products set price=0 where id=$1`, [
  p1.id,
])
const anonProducts = (await as(null, `select id from products`)).map((r) => Number(r.id))
ok(
  anonProducts.includes(Number(p1.id)) && !anonProducts.includes(Number(pDraft.id)),
  'visiteur : publié visible, brouillon invisible',
)
ok(
  (await as(null, `select * from artisan_profiles`)).length === 2,
  'visiteur voit les 2 boutiques approuvées seulement',
)
ok((await as(null, `select * from categories`)).length === 11, 'visiteur voit les catégories')
await as(
  art1,
  `insert into product_images (product_id, path, position) select $1::bigint, $2 || '/' || $1::text || '/' || n || '.webp', n - 1 from generate_series(1, 5) n`,
  [p1.id, art1],
)
await expectFail(
  '6e image refusée',
  art1,
  `insert into product_images (product_id, path, position) values ($1::bigint, $2 || '/' || $1::text || '/6.webp', 5)`,
  [p1.id, art1],
  '5 images',
)
ok(
  (await as(null, `select * from product_images`)).length === 5,
  "visiteur voit les images d'un produit visible",
)

console.log('\nCommande (place_order)')
const shipping = {
  full_name: 'Client Un',
  phone: '22 123 456',
  governorate: 'Tunis',
  city: 'Tunis',
  address: '1 rue de Marseille',
}
await expectFail(
  'artisan ne commande pas',
  art1,
  `select place_order($1,$2)`,
  [[{ product_id: Number(p3.id), quantity: 1 }], shipping],
  'Seuls les clients',
)
await expectFail('visiteur ne commande pas', null, `select place_order($1,$2)`, [
  [{ product_id: Number(p3.id), quantity: 1 }],
  shipping,
])
await expectFail(
  'stock insuffisant → message nommant le produit',
  client1,
  `select place_order($1,$2)`,
  [
    [
      { product_id: Number(p1.id), quantity: 99 },
      { product_id: Number(p3.id), quantity: 1 },
    ],
    shipping,
  ],
  'Jarre de Nabeul',
)
ok(
  (await q(`select count(*)::int n from orders`))[0].n === 0 &&
    (await q(`select stock from products where id=$1`, [p3.id]))[0].stock === 5,
  "… et rien n'est créé, stock intact",
)
await expectFail(
  'produit brouillon refusé',
  client1,
  `select place_order($1,$2)`,
  [[{ product_id: Number(pDraft.id), quantity: 1 }], shipping],
  'plus disponible',
)
await expectFail(
  'téléphone invalide',
  client1,
  `select place_order($1,$2)`,
  [[{ product_id: Number(p3.id), quantity: 1 }], { ...shipping, phone: '123' }],
  '8 chiffres',
)
await expectFail(
  'client ne crée pas de commande en direct',
  client1,
  `insert into orders (client_id, shipping_full_name, shipping_phone, shipping_governorate, shipping_city, shipping_address) values ($1,'a','12345678','a','a','a')`,
  [client1],
)
const orderId = (
  await as(client1, `select place_order($1,$2) as id`, [
    [
      { product_id: Number(p1.id), quantity: 2 },
      { product_id: Number(p2.id), quantity: 1 },
      { product_id: Number(p3.id), quantity: 2 },
      { product_id: Number(p1.id), quantity: 1 },
    ],
    shipping,
  ])
)[0].id
const order = (await q(`select * from orders where id=$1`, [orderId]))[0]
const subs = await q(`select * from sub_orders where order_id=$1 order by id`, [orderId])
ok(/^HRF-\d{8}-00001$/.test(order.order_number), `numéro de commande ${order.order_number}`)
ok(subs.length === 2, '2 artisans → 2 sous-commandes')
ok(Number(order.shipping_total) === 14, 'frais de livraison × 2 = 14,000')
ok(
  Number(order.subtotal) === 45 * 3 + 20 + 30.5 * 2 &&
    Number(order.total) === Number(order.subtotal) + 14,
  `totaux corrects (${order.total})`,
)
ok(order.shipping_phone === '22123456', 'téléphone normalisé')
const stocks = await q(`select id, stock from products where id in ($1,$2,$3) order by id`, [
  p1.id,
  p2.id,
  p3.id,
])
ok(
  stocks[0].stock === 0 && stocks[1].stock === 9 && stocks[2].stock === 3,
  'stock décrémenté (doublons regroupés)',
)
ok(
  (await q(`select count(*)::int n from sub_order_status_history`))[0].n === 2,
  'historique initial écrit',
)
const sub1 = subs.find((s) => s.artisan_id === art1),
  sub2 = subs.find((s) => s.artisan_id === art2)

console.log('\nLecture des commandes (RLS)')
ok(
  (await as(client2, `select * from orders`)).length === 0,
  'un autre client ne voit pas la commande',
)
ok((await as(client2, `select * from order_items`)).length === 0, '… ni ses articles')
ok(
  (await as(client1, `select * from sub_orders`)).length === 2,
  'le client voit ses 2 sous-commandes',
)
ok(
  (await as(art1, `select * from sub_orders`)).length === 1,
  'artisan 1 ne voit que sa sous-commande',
)
ok((await as(art1, `select * from orders`)).length === 1, 'artisan 1 voit la commande parente')
ok((await as(art1, `select * from order_items`)).length === 2, 'artisan 1 ne voit que ses articles')
ok((await as(admin, `select * from order_items`)).length === 3, 'admin voit tout')
ok(
  await blocked(client1, `update sub_orders set status='delivered' where id=$1 returning id`, [
    sub1.id,
  ]),
  'client ne modifie pas le statut en direct',
)
ok(
  (await q(`select status from sub_orders where id=$1`, [sub1.id]))[0].status === 'pending',
  '… le statut reste pending',
)

console.log('\nStatuts (update_sub_order_status)')
await expectFail(
  "artisan ne saute pas d'étape",
  art1,
  `select update_sub_order_status($1,'shipped',null)`,
  [sub1.id],
  'non autorisée',
)
await expectFail(
  "artisan ne touche pas la sous-commande d'un autre",
  art1,
  `select update_sub_order_status($1,'confirmed',null)`,
  [sub2.id],
  'accès',
)
await expectFail(
  'avis impossible avant livraison',
  client1,
  `insert into reviews (product_id, client_id, rating) values ($1,$2,5)`,
  [p1.id, client1],
)
for (const s of ['confirmed', 'preparing', 'shipped', 'delivered'])
  await as(art1, `select update_sub_order_status($1,$2,null)`, [sub1.id, s])
ok(
  (await q(`select status from sub_orders where id=$1`, [sub1.id]))[0].status === 'delivered',
  "cycle complet jusqu'à delivered",
)
ok(
  (
    await as(
      client1,
      `select status from sub_order_status_history where sub_order_id=$1 order by id`,
      [sub1.id],
    )
  ).length === 5,
  'timeline lisible par le client (5 entrées)',
)
await expectFail(
  'delivered est final',
  admin,
  `select update_sub_order_status($1,'cancelled','x')`,
  [sub1.id],
  'terminée',
)
await expectFail(
  "artisan doit donner un motif d'annulation",
  art2,
  `select update_sub_order_status($1,'cancelled',null)`,
  [sub2.id],
  'motif',
)
await as(art2, `select update_sub_order_status($1,'confirmed',null)`, [sub2.id])
await expectFail(
  "client n'annule plus une commande confirmée",
  client1,
  `select update_sub_order_status($1,'cancelled',null)`,
  [sub2.id],
  'en attente',
)
await as(art2, `select update_sub_order_status($1,'cancelled','Pièce cassée')`, [sub2.id])
ok(
  (await q(`select stock from products where id=$1`, [p3.id]))[0].stock === 5,
  'annulation → stock restauré',
)
ok(
  (await q(`select cancel_reason from sub_orders where id=$1`, [sub2.id]))[0].cancel_reason ===
    'Pièce cassée',
  "motif d'annulation enregistré",
)

// Client annule une commande pending
const o2 = (
  await as(client1, `select place_order($1,$2) as id`, [
    [{ product_id: Number(p2.id), quantity: 2 }],
    shipping,
  ])
)[0].id
const s3 = (await q(`select id from sub_orders where order_id=$1`, [o2]))[0].id
ok(
  (await q(`select order_number from orders where id=$1`, [o2]))[0].order_number.endsWith('-00002'),
  'numérotation séquentielle',
)
await as(client1, `select update_sub_order_status($1,'cancelled',null)`, [s3])
ok(
  (await q(`select stock from products where id=$1`, [p2.id]))[0].stock === 9,
  'client annule (pending) → stock restauré',
)

console.log('\nAvis (RM-8)')
await as(
  client1,
  `insert into reviews (product_id, client_id, rating, comment) values ($1,$2,5,'Superbe')`,
  [p1.id, client1],
)
ok(true, 'avis possible après livraison')
await expectFail(
  'un seul avis par produit',
  client1,
  `insert into reviews (product_id, client_id, rating) values ($1,$2,4)`,
  [p1.id, client1],
)
await expectFail(
  "pas d'avis sur un produit non livré (annulé)",
  client1,
  `insert into reviews (product_id, client_id, rating) values ($1,$2,4)`,
  [p3.id, client1],
)
await expectFail(
  'client2 ne peut pas noter',
  client2,
  `insert into reviews (product_id, client_id, rating) values ($1,$2,4)`,
  [p1.id, client2],
)
await expectFail(
  "l'auteur ne masque pas son avis",
  client1,
  `update reviews set is_hidden=true where product_id=$1`,
  [p1.id],
  'administrateur',
)
await expectFail(
  'note hors 1–5 refusée',
  client1,
  `update reviews set rating=6 where product_id=$1`,
  [p1.id],
)
ok(
  Number(
    (await as(null, `select avg_rating from product_ratings where product_id=$1`, [p1.id]))[0]
      ?.avg_rating,
  ) === 5,
  'vue product_ratings',
)
await as(admin, `update reviews set is_hidden=true where product_id=$1`, [p1.id])
ok(
  (await as(null, `select * from product_ratings`)).length === 0,
  'avis masqué exclu de la moyenne',
)
ok((await as(null, `select * from reviews`)).length === 0, 'avis masqué invisible pour le public')

console.log('\nFormulaire produit (Phase 3)')
// L'application envoie slug: '' (colonne obligatoire dans les types) : le trigger le génère
const pSlug = (
  await as(
    art1,
    `insert into products (artisan_id, category_id, name, price, stock, slug) values ($1,$2,'Bol émaillé',12.5,4,'') returning id, slug`,
    [art1, cat],
  )
)[0]
ok(/^bol-emaille-[0-9a-f]{6}$/.test(pSlug.slug), `slug '' remplacé par le trigger (${pSlug.slug})`)
const pForced = (
  await as(
    art1,
    `insert into products (artisan_id, category_id, name, price, stock, slug) values ($1,$2,'Bol',1,1,'mon-slug') returning slug`,
    [art1, cat],
  )
)[0]
ok(pForced.slug !== 'mon-slug', 'un artisan ne choisit pas son slug')
let deleteCode = null
try {
  await as(art1, `delete from products where id=$1`, [p1.id])
} catch (e) {
  deleteCode = e.code
}
ok(
  deleteCode === '23503',
  'suppression d’un produit commandé → code 23503 (passage en brouillon côté app)',
)
// Réordonnancement : suppression puis ajout au sein de la limite de 5 images
await as(art1, `delete from product_images where product_id=$1 and position=4`, [p1.id])
await as(art1, `update product_images set position=0 where product_id=$1 and position=3`, [p1.id])
ok(
  (
    await as(
      art1,
      `insert into product_images (product_id, path, position) values ($1::bigint, $2 || '/' || $1::text || '/n.webp', 4) returning id`,
      [p1.id, art1],
    )
  ).length === 1,
  'retirer une image libère une place (limite de 5)',
)

console.log('\nSuppression, favoris, vues')
await expectFail(
  'produit commandé non supprimable',
  art1,
  `delete from products where id=$1`,
  [p1.id],
  'brouillon',
)
ok(
  (await as(art2, `delete from products where id=$1 returning id`, [pDraft.id])).length === 1,
  'produit jamais commandé supprimable',
)
await expectFail(
  'catégorie utilisée non supprimable',
  admin,
  `delete from categories where id=$1`,
  [cat],
  'désactivez',
)
await as(client1, `insert into favorites (client_id, product_id) values ($1,$2)`, [client1, p2.id])
ok((await as(client2, `select * from favorites`)).length === 0, 'favoris privés')
await expectFail(
  "artisan n'a pas de favoris",
  art1,
  `insert into favorites (client_id, product_id) values ($1,$2)`,
  [art1, p3.id],
)
const upd0 = (await q(`select updated_at from products where id=$1`, [p2.id]))[0].updated_at
await as(null, `select increment_product_view($1)`, [p2.id])
await as(art1, `select increment_product_view($1)`, [p2.id])
ok(
  (await q(`select views_count from products where id=$1`, [p2.id]))[0].views_count === 1,
  'vue comptée, sauf pour le propriétaire',
)
ok(
  (await q(`select updated_at from products where id=$1`, [p2.id]))[0].updated_at.getTime() ===
    upd0.getTime(),
  'une vue ne modifie pas updated_at',
)
await as(art1, `update products set views_count=999 where id=$1`, [p2.id])
ok(
  (await q(`select views_count from products where id=$1`, [p2.id]))[0].views_count === 1,
  "views_count non modifiable par l'artisan",
)

console.log('\nAdmin : masquer / suspendre / désactiver (RM-1, RM-7)')
await as(admin, `update products set admin_hidden=true where id=$1`, [p2.id])
ok(
  !(await as(null, `select id from products`)).some((r) => r.id == p2.id),
  'produit masqué → disparaît du catalogue',
)
ok(
  (await as(art1, `select id from products where id=$1`, [p2.id])).length === 1,
  '… mais reste visible pour son artisan',
)
await expectFail(
  'artisan ne démasque pas',
  art1,
  `update products set admin_hidden=false where id=$1`,
  [p2.id],
  'administrateur',
)
await as(admin, `update artisan_profiles set status='suspended' where id=$1`, [art2])
ok(
  !(await as(null, `select artisan_id from products`)).some((r) => r.artisan_id === art2),
  'artisan suspendu → ses produits disparaissent',
)
ok(
  (await as(art2, `select * from sub_orders`)).length === 1,
  '… ses sous-commandes restent visibles pour lui',
)
ok(
  (await as(client1, `select id from artisan_profiles where id=$1`, [art2])).length === 1,
  "… et l'artisan reste lisible par son client",
)
await expectFail(
  'artisan suspendu ne crée pas de produit',
  art2,
  `insert into products (artisan_id, category_id, name, price, stock) values ($1,$2,'X',1,1)`,
  [art2, cat],
)
await as(admin, `update profiles set is_active=false where id=$1`, [client2])
await expectFail(
  'client désactivé ne commande pas',
  client2,
  `select place_order($1,$2)`,
  [[{ product_id: Number(p1.id), quantity: 1 }], shipping],
  'désactivé',
)
await as(admin, `update app_settings set shipping_fee=8 where id=1`)
ok(
  await blocked(client1, `update app_settings set shipping_fee=0 where id=1 returning id`),
  'client ne change pas les frais de livraison',
)
ok(
  Number((await q(`select shipping_fee from app_settings`))[0].shipping_fee) === 8,
  'admin change les frais de livraison',
)

console.log('\nTableaux de bord')
const as1 = (await as(art1, `select artisan_dashboard_stats() s`))[0].s
ok(
  Number(as1.revenue) === 155 + 7 &&
    as1.sales_by_month.length === 6 &&
    as1.top_products.length === 2,
  `stats artisan (CA ${as1.revenue})`,
)
await expectFail(
  "client n'accède pas aux stats artisan",
  client1,
  `select artisan_dashboard_stats()`,
  [],
  'artisans',
)
const ads = (await as(admin, `select admin_dashboard_stats() s`))[0].s
ok(
  ads.clients === 3 &&
    ads.artisans.total === 3 &&
    ads.orders === 2 &&
    ads.pending_artisans.length === 1,
  'stats admin',
)
await expectFail(
  "artisan n'accède pas aux stats admin",
  art1,
  `select admin_dashboard_stats()`,
  [],
  'administrateurs',
)

console.log('\nStorage')
ok((await q(`select count(*)::int n from storage.buckets`))[0].n === 4, '4 buckets')
ok(
  (
    await as(
      art1,
      `insert into storage.objects (bucket_id, name) values ('product-images', $1) returning id`,
      [`${art1}/p/1.webp`],
    )
  ).length === 1,
  'artisan approuvé upload dans son dossier',
)
await expectFail(
  "artisan n'écrit pas dans le dossier d'un autre",
  art1,
  `insert into storage.objects (bucket_id, name) values ('product-images', $1)`,
  [`${art2}/p/1.webp`],
)
await expectFail(
  "artisan en attente n'upload pas d'image produit",
  art3,
  `insert into storage.objects (bucket_id, name) values ('product-images', $1)`,
  [`${art3}/p/1.webp`],
)
ok(
  (
    await as(
      art3,
      `insert into storage.objects (bucket_id, name) values ('shop-assets', $1) returning id`,
      [`${art3}/logo.webp`],
    )
  ).length === 1,
  'artisan en attente upload son logo',
)
await expectFail(
  "client n'upload pas d'image de catégorie",
  client1,
  `insert into storage.objects (bucket_id, name) values ('category-images', 'c.webp')`,
)
ok(
  (
    await as(
      client1,
      `insert into storage.objects (bucket_id, name) values ('avatars', $1) returning id`,
      [`${client1}/a.webp`],
    )
  ).length === 1,
  'client upload son avatar',
)

console.log('\nCatalogue (Phase 4)')
const art4 = await signup('a4@x.tn', {
  role: 'artisan',
  full_name: 'Hela',
  shop_name: 'Atelier Hela',
})
await as(admin, `update artisan_profiles set status='approved' where id=$1`, [art4])
const cat2 = (await q(`select id from categories where slug='bijoux'`))[0].id
const insert4 = async (name, extra = '') =>
  (
    await as(
      art4,
      `insert into products (artisan_id, category_id, name, description, price, stock, status) values ($1,$2,$3,'Pièce émaillée à la main',$4,2,${extra || "'published'"}) returning id`,
      [art4, cat, name, 30],
    )
  )[0].id
const pVisible = await insert4('Céramique émaillée')
const pDraft4 = await insert4('Brouillon caché', "'draft'")
const pBijou = (
  await as(
    art4,
    `insert into products (artisan_id, category_id, name, price, stock, status) values ($1,$2,'Bracelet',20,1,'published') returning id`,
    [art4, cat2],
  )
)[0].id
await as(
  art4,
  `insert into product_images (product_id, path, position) values ($1::bigint, $2 || '/' || $1::text || '/2.webp', 1), ($1::bigint, $2 || '/' || $1::text || '/1.webp', 0)`,
  [pVisible, art4],
)
const ids = async (uid, sql = `select id from catalog_products`) =>
  (await as(uid, sql)).map((r) => Number(r.id))
const anonIds = await ids(null)
ok(
  anonIds.includes(Number(pVisible)) && !anonIds.includes(Number(pDraft4)),
  'vue : publié visible, brouillon exclu',
)
ok(!anonIds.includes(Number(p2.id)), 'vue : produit masqué par l’admin exclu')
ok(
  !(await as(null, `select artisan_id from catalog_products`)).some((r) => r.artisan_id === art2),
  'vue : artisan suspendu exclu',
)
ok(!(await ids(admin)).includes(Number(p2.id)), 'vue : RM-1 appliquée même pour l’admin')
ok(
  !(await ids(art4)).includes(Number(pDraft4)),
  'vue : le propriétaire ne voit pas son brouillon dans le catalogue',
)
const row = (await as(null, `select * from catalog_products where id=$1`, [pVisible]))[0]
ok(row.image_path === `${art4}/${pVisible}/1.webp`, 'vue : image principale = position 0')
ok(
  row.artisan_slug === 'atelier-hela' && row.category_slug === 'poterie-ceramique',
  'vue : slugs artisan et catégorie',
)
ok(
  (await as(null, `select id from catalog_products where search_text ilike '%ceramique emaillee%'`))
    .length === 1,
  'recherche sans accents : « ceramique emaillee » → « Céramique émaillée »',
)
await as(admin, `update categories set is_active=false where id=$1`, [cat2])
ok(
  !(await ids(null)).includes(Number(pBijou)),
  'catégorie désactivée → ses produits sortent du catalogue',
)
await as(admin, `update categories set is_active=true where id=$1`, [cat2])

console.log('\nAvis publics (product_reviews)')
await q(`update profiles set full_name='Amira Ben Salah' where id=$1`, [client1])
await q(
  `insert into reviews (product_id, client_id, rating, comment) values ($1,$2,4,'Très belle pièce')`,
  [pVisible, client1],
)
await q(
  `insert into reviews (product_id, client_id, rating, comment, is_hidden) values ($1,$2,1,'Spam',true)`,
  [pVisible, client2],
)
const pub = await as(null, `select * from product_reviews($1)`, [pVisible])
ok(
  pub.length === 1 && pub[0].author_name === 'Amira S.',
  `nom abrégé « ${pub[0]?.author_name} », avis masqué exclu`,
)
ok(!('client_id' in pub[0]) && !('email' in pub[0]), 'aucune donnée personnelle exposée')
ok(
  Number(
    (await as(null, `select avg_rating from catalog_products where id=$1`, [pVisible]))[0]
      .avg_rating,
  ) === 4,
  'note moyenne dans la vue (hors avis masqués)',
)

console.log('\nCompte client et avis (Phase 7)')
ok(
  (
    await as(
      client1,
      `update profiles set governorate='Ariana', city='La Soukra', address='5 rue des Roses' where id=$1 returning city`,
      [client1],
    )
  )[0]?.city === 'La Soukra',
  'le client modifie son adresse par défaut (CLI-1)',
)
const myReview = (
  await as(client1, `select id from reviews where client_id=$1 and product_id=$2`, [
    client1,
    pVisible,
  ])
)[0]
ok(
  (
    await as(
      client1,
      `update reviews set rating=3, comment='Finalement moyen' where id=$1 returning rating`,
      [myReview.id],
    )
  )[0]?.rating === 3,
  'l’auteur modifie son avis',
)
ok(
  (await as(client2, `update reviews set rating=1 where id=$1 returning id`, [myReview.id]))
    .length === 0,
  'un autre client ne modifie pas cet avis',
)
ok(
  (await as(art4, `select id from reviews where product_id=$1`, [pVisible])).length === 1,
  'l’artisan lit les avis visibles de ses produits (ART-9)',
)
ok(
  (await as(art4, `select * from product_reviews($1)`, [pVisible]))[0]?.author_name === 'Amira S.',
  'l’artisan obtient le nom abrégé via product_reviews',
)
ok(
  (await as(client1, `delete from reviews where id=$1 returning id`, [myReview.id])).length === 1,
  'l’auteur supprime son avis',
)
ok(
  (await as(client1, `select can_review_product($1) as ok`, [pVisible]))[0].ok === false,
  'can_review_product : faux sans sous-commande livrée',
)
ok(
  (await as(client1, `select can_review_product($1) as ok`, [p1.id]))[0].ok === true,
  'can_review_product : vrai après livraison',
)

console.log('\nAdministration (Phase 8)')
ok((await as(admin, `select id from profiles`)).length >= 7, 'l’admin lit tous les profils (ADM-3)')
ok(
  (
    await as(admin, `update artisan_profiles set status='approved' where id=$1 returning status`, [
      art2,
    ])
  )[0]?.status === 'approved',
  'l’admin réactive une boutique suspendue (ADM-2)',
)
ok(
  (await as(admin, `select id from catalog_products where artisan_id=$1`, [art2])).length > 0,
  '… ses produits publiés reviennent dans le catalogue',
)
const newCat = (
  await as(
    admin,
    `insert into categories (name, slug, sort_order) values ('Calligraphie', 'calligraphie', 12) returning id`,
  )
)[0]
ok(Boolean(newCat?.id), 'l’admin crée une catégorie (ADM-5)')
ok(
  (
    await as(admin, `update categories set is_active=false where id=$1 returning is_active`, [
      newCat.id,
    ])
  )[0]?.is_active === false,
  'l’admin désactive une catégorie',
)
ok(
  (await as(admin, `delete from categories where id=$1 returning id`, [newCat.id])).length === 1,
  'catégorie vide supprimable',
)
await expectFail(
  'un artisan ne crée pas de catégorie',
  art1,
  `insert into categories (name, slug) values ('X', 'x-art')`,
)
const rv = (
  await q(`insert into reviews (product_id, client_id, rating) values ($1,$2,2) returning id`, [
    p3.id,
    client1,
  ])
)[0]
ok(
  (await as(admin, `update reviews set is_hidden=true where id=$1 returning is_hidden`, [rv.id]))[0]
    ?.is_hidden === true,
  'l’admin masque un avis (ADM-7)',
)
ok(
  (await as(admin, `delete from reviews where id=$1 returning id`, [rv.id])).length === 1,
  'l’admin supprime un avis',
)
const o3 = (
  await as(client1, `select place_order($1,$2) as id`, [
    [{ product_id: Number(p3.id), quantity: 1 }],
    shipping,
  ])
)[0].id
const s4 = (await q(`select id from sub_orders where order_id=$1`, [o3]))[0].id
await as(admin, `select update_sub_order_status($1,'shipped',null)`, [s4])
ok(
  (await q(`select status from sub_orders where id=$1`, [s4]))[0].status === 'shipped',
  'l’admin saute des étapes (pending → shipped)',
)
await as(admin, `select update_sub_order_status($1,'cancelled','Colis perdu')`, [s4])
ok(
  (await q(`select status from sub_orders where id=$1`, [s4]))[0].status === 'cancelled',
  'l’admin annule un colis expédié (ADM-6)',
)
await expectFail(
  'aucune modification après annulation',
  admin,
  `select update_sub_order_status($1,'pending',null)`,
  [s4],
  'terminée',
)
ok(
  (
    await as(
      admin,
      `update app_settings set site_name='Hirfa Tunisie', contact_email='bonjour@hirfa.tn' where id=1 returning site_name`,
    )
  )[0]?.site_name === 'Hirfa Tunisie',
  'l’admin modifie nom et email du site (ADM-8)',
)

console.log('\nRevue de sécurité (Phase 9)')
await expectFail(
  'image produit : chemin dans le dossier d’un autre artisan refusé',
  art1,
  `insert into product_images (product_id, path, position) values ($1::bigint, $2 || '/' || $1::text || '/vol.webp', 0)`,
  [p2.id, art4],
)
await expectFail(
  'image produit : chemin d’un autre produit refusé',
  art1,
  `insert into product_images (product_id, path, position) values ($1::bigint, $2 || '/999999/x.webp', 0)`,
  [p2.id, art1],
)
ok(
  (
    await as(
      admin,
      `insert into product_images (product_id, path, position) values ($1, 'seed/x.webp', 0) returning id`,
      [p2.id],
    )
  ).length === 1,
  'image produit : l’admin n’est pas contraint',
)
await q(
  `insert into storage.objects (bucket_id, name) values ('product-images', $1), ('avatars', $2)`,
  [`${art4}/1/a.webp`, `${client2}/b.webp`],
)
ok(
  (await as(null, `select name from storage.objects`)).length === 0,
  'storage : un visiteur ne peut pas lister les fichiers',
)
ok(
  (await as(client1, `select name from storage.objects`)).every((o) =>
    o.name.startsWith(`${client1}/`),
  ),
  'storage : un utilisateur ne liste que son dossier',
)
ok(
  (await as(art1, `select name from storage.objects where name like $1`, [`${art4}/%`])).length ===
    0,
  'storage : un artisan ne liste pas les fichiers d’un autre',
)
ok(
  (await as(admin, `select name from storage.objects`)).length >= 2,
  'storage : l’admin liste tout',
)
ok(
  (
    await as(
      art1,
      `insert into storage.objects (bucket_id, name) values ('product-images', $1) returning name`,
      [`${art1}/2/c.webp`],
    )
  ).length === 1,
  'storage : envoi dans son dossier toujours possible (INSERT … RETURNING)',
)
ok(
  (await q(`select role from profiles where id=$1`, [hacker]))[0].role === 'client',
  'personne ne devient admin par l’inscription (§12)',
)

console.log(`\n${passed} réussis, ${failed} échoués`)
process.exit(failed ? 1 : 0)
