# CLAUDE.md — Projet Hirfa

## Contexte
Marketplace d'artisans tunisiens (projet académique). Les spécifications complètes sont dans **`CAHIER_DES_CHARGES.md`** : c'est la source de vérité. Le lire entièrement en début de session.

## Stack
React + TypeScript + Vite · React Router · TanStack Query · Zustand · Tailwind CSS + shadcn/ui · React Hook Form + Zod · Recharts · **Supabase** (Postgres, Auth, Storage, RLS, RPC). Pas de backend custom.

## Méthode de travail
- Travailler **phase par phase** (§11 du cahier). Ne réaliser **que la phase demandée**.
- À la fin de chaque phase :
  1. lancer `npm run build` et `npm run lint`, puis corriger toutes les erreurs ;
  2. écrire un résumé court : fichiers créés, ce qui est testable, **étapes de test manuel** ;
  3. lister les commandes que l'utilisateur doit lancer lui-même (ex. `npx supabase db push`) ;
  4. **s'arrêter** et attendre la validation.
- Toute décision non couverte par le cahier : choisir la solution la plus simple, puis l'ajouter à `DECISIONS.md`.
- Ne jamais modifier une migration déjà appliquée : créer une nouvelle migration (`npx supabase migration new <nom>`).
- Après chaque changement de schéma : rappeler de lancer `npm run db:types`.

## Règles impératives
- UI **100 % en français** (libellés, erreurs, toasts). Les statuts sont traduits via `src/lib/labels.ts`.
- Prix en TND, `numeric(10,3)`, affichés avec `formatPrice()` (`src/lib/format.ts`).
- **RLS activée sur toutes les tables.** La sécurité ne repose jamais uniquement sur l'UI.
- Création de commande et changement de statut **uniquement** via les RPC `place_order` et `update_sub_order_status` (transactionnelles, `SECURITY DEFINER`, `SET search_path = public`).
- La clé secrète / `service_role` n'est jamais dans `src/` ni dans une variable `VITE_*`. Elle sert uniquement à `scripts/seed-demo.ts`.
- Le rôle `admin` ne peut jamais être obtenu par l'inscription.
- TypeScript strict ; types Supabase générés dans `src/types/database.ts` ; pas de `any` non justifié.
- Composants petits et réutilisables ; hooks de données dans `src/features/<domaine>/api.ts`.
- Mobile-first, responsive dès 360 px.
- Ne pas télécharger de ressources externes pour le seed : générer les images placeholder localement.

## Scripts npm attendus
```
dev        vite
build      tsc -b && vite build
lint       eslint .
preview    vite preview
db:push    supabase db push
db:types   supabase gen types typescript --linked > src/types/database.ts
seed       tsx scripts/seed-demo.ts
```
(La CLI Supabase est une devDependency `supabase`, appelée via les scripts npm.)

## Variables d'environnement (`.env.local`)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=     # clé "publishable" (ou "anon" legacy)
SUPABASE_SECRET_KEY=               # clé "secret" (ou "service_role" legacy) — seed uniquement
```
