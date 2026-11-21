# Hirfa — Marketplace des artisans tunisiens

Hirfa est un projet académique : une vitrine en ligne où les artisans tunisiens (potiers, tisserands, bijoutiers…) ouvrent une boutique, et où les clients commandent auprès de plusieurs artisans en une seule fois, avec **paiement à la livraison**.

- Spécifications : [`CAHIER_DES_CHARGES.md`](CAHIER_DES_CHARGES.md)
- Décisions techniques : [`DECISIONS.md`](DECISIONS.md)
- Guide pas à pas : [`GUIDE_INSTALLATION.md`](GUIDE_INSTALLATION.md)

## Stack

React 19 + TypeScript + Vite · React Router · TanStack Query · Zustand · Tailwind CSS v4 + shadcn/ui · React Hook Form + Zod · Recharts · **Supabase** (Postgres, Auth, Storage, RLS, RPC). Il n'y a pas de backend custom.

## Prérequis

- Node.js 20 ou plus récent
- Un projet [Supabase](https://supabase.com) (région Frankfurt recommandée)

## Installation

```bash
npm install
cp .env.example .env.local   # puis renseigner les clés Supabase
npm run dev                  # http://localhost:5173
```

### Variables d'environnement (`.env.local`)

| Variable | Usage |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet (`https://xxxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé « publishable » (ou « anon »), utilisée par le frontend |
| `SUPABASE_SECRET_KEY` | Clé « secret » (ou « service_role »), **réservée au script de seed**. Ne jamais la préfixer par `VITE_`. |

### Base de données

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npm run db:push     # applique les migrations + seed.sql (catégories)
npm run db:types    # régénère src/types/database.ts
```

Pour tester les migrations **en local, sans Supabase ni Docker** (Postgres en WebAssembly) :

```bash
npm run db:test     # migrations + seed + 105 scénarios RLS / RPC / triggers
```

## Scripts

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Vérification TypeScript puis build de production |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (avec tri des classes Tailwind) |
| `npm run preview` | Prévisualisation du build |
| `npm run db:push` | Pousse les migrations et `seed.sql` vers Supabase |
| `npm run db:types` | Génère les types TypeScript depuis la base liée |
| `npm run db:test` | Teste migrations, RLS et RPC dans PGlite |
| `npm run seed` | Données de démonstration (disponible en Phase 9) |

## Structure

```
supabase/       config.toml, migrations/, seed.sql
scripts/        seed-demo.ts, seed-images/
src/
  lib/          supabase.ts, format.ts, labels.ts, constants.ts, utils.ts
  types/        database.ts (généré)
  components/   ui/ (shadcn), layout/, common/
  features/     <domaine>/api.ts (hooks de données)
  pages/        public/, client/, artisan/, admin/
  router.tsx    toutes les routes
```

## Créer un compte administrateur

Le rôle `admin` ne peut pas être obtenu par l'inscription. Inscris-toi normalement, puis exécute dans le **SQL Editor** de Supabase :

```sql
update profiles set role = 'admin' where email = 'ton.email@exemple.com';
```

## Comptes de démonstration

Ils seront créés par `npm run seed` (Phase 9) :

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@hirfa.tn` | `Hirfa2026!` |
| Artisans | `artisan1@hirfa.tn` … `artisan5@hirfa.tn` | `Hirfa2026!` |
| Clients | `client1@hirfa.tn` … `client3@hirfa.tn` | `Hirfa2026!` |

## Avancement

- [x] Phase 0 — Initialisation (projet, layouts, accueil statique)
- [x] Phase 1 — Base de données
- [x] Phase 2 — Authentification
- [x] Phase 3 — Espace artisan
- [ ] Phase 4 — Catalogue public
- [ ] Phase 5 — Panier et commande
- [ ] Phase 6 — Suivi des commandes
- [ ] Phase 7 — Favoris, avis, compte client
- [ ] Phase 8 — Administration
- [ ] Phase 9 — Tableaux de bord, seed et finitions
