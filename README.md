# Hirfa — Marketplace des artisans tunisiens

Hirfa (« métier artisanal » en arabe) est une vitrine en ligne où les artisans tunisiens — potiers, tisserands, bijoutiers, maroquiniers… — ouvrent gratuitement une boutique, et où les clients commandent auprès de plusieurs artisans en une seule fois, avec **paiement à la livraison**.

> Projet académique. Aucune transaction réelle.

- Spécifications : [`CAHIER_DES_CHARGES.md`](CAHIER_DES_CHARGES.md)
- Décisions techniques : [`DECISIONS.md`](DECISIONS.md)
- Recette (checklist §12) : [`RECETTE.md`](RECETTE.md)
- Guide pas à pas : [`GUIDE_INSTALLATION.md`](GUIDE_INSTALLATION.md)

## Fonctionnalités

| Rôle | Ce qu'il peut faire |
|---|---|
| **Visiteur** | Parcourir l'accueil, le catalogue (recherche sans accents, filtres, tri, pagination), les fiches produit et les boutiques ; remplir un panier sans compte. |
| **Client** | Commander auprès de plusieurs artisans (une sous-commande et un colis par artisan, paiement à la livraison), suivre chaque colis (historique), annuler tant que c'est « En attente », gérer ses favoris, laisser un avis après livraison, modifier son profil, son adresse et son mot de passe. |
| **Artisan** | S'inscrire (boutique validée par l'admin), gérer sa boutique (logo, bannière, réseaux), ses produits (1 à 5 images compressées dans le navigateur), faire avancer ses commandes (confirmée → en préparation → expédiée → livrée, annulation avec motif), consulter son tableau de bord et les avis reçus. |
| **Administrateur** | Valider, refuser, suspendre ou réactiver les artisans ; activer ou désactiver les clients ; masquer ou mettre en avant des produits ; gérer les catégories, toutes les commandes, les avis et les paramètres (frais de livraison) ; tableau de bord global. |

## Stack

React 19 + TypeScript (strict) + Vite · React Router · TanStack Query · Zustand · Tailwind CSS v4 + shadcn/ui · React Hook Form + Zod · Recharts · **Supabase** (Postgres, Auth, Storage, RLS, RPC). Il n'y a **pas de backend custom** : toute la logique sensible (commande, statuts, stock) est dans des fonctions PostgreSQL, et la sécurité repose sur la RLS.

## Installation

**Prérequis :** Node.js 20 ou plus récent, un projet [Supabase](https://supabase.com) (région Frankfurt recommandée).

```bash
npm install
cp .env.example .env.local     # puis renseigner les 3 clés Supabase
```

| Variable (`.env.local`) | Usage |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet (`https://xxxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé « publishable » (ou « anon »), utilisée par le frontend |
| `SUPABASE_SECRET_KEY` | Clé « secret » (ou « service_role »), **uniquement pour `npm run seed`**. Jamais préfixée par `VITE_`, jamais dans `src/`. |

### Base de données

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npm run db:push        # migrations + seed.sql (catégories, paramètres)
npm run db:types       # régénère src/types/database.ts
npx supabase config push   # facultatif : site_url, « Confirm email » désactivé (dev)
```

### Données de démonstration

```bash
npm run seed           # comptes, boutiques, ~30 produits avec images, commandes, avis
npm run dev            # http://localhost:5173
```

Le script est **idempotent** (relançable sans doublons). Les images sont des motifs générés localement (`scripts/placeholder-png.ts`), sans aucun téléchargement. Les commandes et les avis sont créés **en se connectant** en tant que client puis artisan : ils passent par `place_order`, `update_sub_order_status` et la RLS, comme dans l'application.

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@hirfa.tn` | `Hirfa2026!` |
| Artisans approuvés | `artisan1@hirfa.tn` (poterie, Nabeul) · `artisan2@` (tapis, Kairouan) · `artisan3@` (bijoux, Djerba) · `artisan4@` (cuir, Tunis) | `Hirfa2026!` |
| Artisan en attente | `artisan5@hirfa.tn` | `Hirfa2026!` |
| Clients | `client1@hirfa.tn` · `client2@hirfa.tn` · `client3@hirfa.tn` | `Hirfa2026!` |

Sans le seed, on obtient un compte admin en s'inscrivant puis, dans le **SQL Editor** : `update profiles set role = 'admin' where email = '…';` (le rôle admin ne peut jamais être obtenu par l'inscription).

## Scripts

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Vérification TypeScript (app + scripts) puis build de production |
| `npm run lint` · `npm run format` | ESLint · Prettier (tri des classes Tailwind) |
| `npm run preview` | Prévisualisation du build |
| `npm run db:push` · `npm run db:types` | Migrations vers Supabase · types TypeScript générés |
| `npm run db:test` | **147 tests de la base** (migrations, RLS, RPC, triggers, Storage) dans PGlite, sans Supabase ni Docker |
| `npm run seed` | Données de démonstration |

## Sécurité

- **RLS sur toutes les tables** ; l'interface ne fait que refléter des règles appliquées par la base.
- **Commandes et statuts uniquement via RPC** (`place_order`, `update_sub_order_status`) : `SECURITY DEFINER`, `search_path` fixé, transaction unique, `SELECT … FOR UPDATE` sur le stock. Aucun droit d'écriture direct sur les tables de commande.
- **Colonnes privilégiées protégées par triggers** (RM-9) : rôle, compte actif, statut de boutique, masquage et mise en avant de produits, masquage d'avis.
- **Droits explicites (`GRANT`)** au strict nécessaire pour `anon` et `authenticated`.
- **Storage** : écriture limitée au dossier `{auth.uid()}/…` de chacun ; pas de listing public ; les images de produit doivent appartenir à leur propriétaire et à leur produit.
- Données personnelles : `profiles` n'est lisible que par son propriétaire et l'admin ; les noms d'auteurs d'avis sont abrégés (« Amira S. »).
- Revue détaillée et points d'attention pour une mise en production : voir [`RECETTE.md`](RECETTE.md#revue-de-sécurité).

## Structure

```
supabase/
  migrations/      schéma, fonctions, RLS, storage, grants, catalogue, durcissement
  seed.sql         catégories + paramètres
  tests/           db.test.mjs (PGlite)
scripts/
  seed-demo.ts     données de démonstration (clé secrète)
  placeholder-png.ts  images générées localement
src/
  lib/             supabase, format (prix TND), labels (statuts en français), errors, storage
  types/           database.ts (généré)
  stores/          auth, cart (Zustand)
  hooks/           useAuth, useProfile, usePageTitle
  components/      ui/ (shadcn), layout/, common/, admin/, orders/, reviews/, auth/
  features/        <domaine>/api.ts (hooks TanStack Query)
  pages/           public/, client/, artisan/, admin/ (chargées à la demande)
```

## Déploiement (Vercel)

`vercel.json` redirige toutes les routes vers `index.html` (SPA). Sur Vercel, ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` (**pas** la clé secrète), puis déclarer l'URL Vercel dans Supabase (*Authentication → URL Configuration* : Site URL et Redirect URLs).

## Avancement

Phases 0 à 9 réalisées (voir [`DECISIONS.md`](DECISIONS.md) pour le détail des choix). Hors périmètre V1 (§13) : paiement en ligne, commission, variantes, arabe, messagerie, notifications, codes promo, application mobile, suivi transporteur.
