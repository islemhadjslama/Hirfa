# Décisions techniques — Hirfa

Décisions prises pendant le développement sur des points non couverts (ou ambigus) dans le cahier des charges. Règle appliquée : la solution la plus simple qui respecte le cahier.

## Phase 0 — Initialisation

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D-01 | Version de TypeScript | **TypeScript 6.0** (et non 7.x, proposé par défaut par `create-vite`). | `typescript-eslint` (requis par `lint: eslint .`) ne prend en charge que TypeScript < 6.1. |
| D-02 | Linter | ESLint (flat config) + `typescript-eslint` + `react-hooks` + `react-refresh`. Le gabarit Vite utilisait `oxlint` : il a été retiré. | Le CLAUDE.md impose `eslint .`. `no-explicit-any` est en erreur. |
| D-03 | shadcn/ui | Style `radix-nova`, base Radix, variables CSS. Thème recoloré avec la palette Hirfa dans `src/index.css`. | Compatible Tailwind v4. |
| D-04 | Mode sombre | **Pas de mode sombre en V1** : thème clair uniquement. `next-themes` retiré, le `Toaster` est fixé en `theme="light"`. | Non demandé par le cahier ; simplifie le thème. |
| D-05 | Polices | `@fontsource-variable/fraunces` et `@fontsource-variable/inter` (versions variables des paquets `@fontsource`). | Une seule police par famille, toutes les graisses. |
| D-06 | Chargement des pages | `React.lazy` regroupé dans `src/pages/lazy.ts` ; `Suspense` dans chaque layout. | La règle `react-refresh` interdit de définir des composants dans `router.tsx`, qui exporte un objet. |
| D-07 | Routes pas encore réalisées | Elles affichent une page provisoire « Bientôt disponible » (`ComingSoonPage`). Les URL inconnues affichent la 404. | Toute la navigation reste cliquable dès la Phase 0. |
| D-08 | Accueil statique | Catégories codées en dur dans `src/features/catalog/home-categories.ts`, avec une icône lucide à la place de l'image. Les sections « produits / artisans mis en avant » affichent un état vide. | Phase 0 = accueil statique. Les slugs seront repris à l'identique dans `seed.sql` (Phase 1). Tout cela devient dynamique en Phase 4. |
| D-09 | Slugs des catégories | `poterie-ceramique`, `tapis-tissage`, `bijoux`, `cuir-maroquinerie`, `vannerie`, `bois-olivier`, `broderie-textile`, `cuivre-dinanderie`, `verre-souffle`, `decoration`, `savons-cosmetiques-naturels`. | Slugify du nom (sans accents ni « & »). |
| D-10 | Types Supabase | `src/types/database.ts` est un fichier provisoire (schéma vide) jusqu'à `npm run db:types`. Les types de statuts sont déclarés dans `src/lib/labels.ts` en attendant. | Le build doit passer avant que la base existe. |
| D-11 | Client Supabase | `src/lib/supabase.ts` lève une erreur en français si les variables `VITE_*` manquent. Il n'est encore importé par aucune page, donc l'accueil fonctionne même sans `.env.local`. | Erreur claire plutôt qu'un échec obscur. |
| D-12 | Supabase local | `supabase/config.toml` généré par `supabase init`. `site_url` et les URL de redirection pointent vers `http://localhost:5173`. | Cohérent avec le guide d'installation. |
| D-13 | `/artisan/en-attente` | Rattachée provisoirement au layout public. | À revoir en Phase 2 avec les gardes de routes. |
