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
| D-13 | `/artisan/en-attente` | Rattachée provisoirement au layout public ; **déplacée dans l'espace artisan en Phase 2** (voir D-37). | À revoir en Phase 2 avec les gardes de routes. |

## Phase 1 — Base de données

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D-14 | `current_role()` | Renommée **`current_user_role()`**. Elle renvoie `NULL` si l'utilisateur est anonyme ou désactivé. | `current_role` est un mot réservé SQL (`CURRENT_ROLE`). |
| D-15 | Helpers RLS supplémentaires | `is_public_artisan`, `is_order_client`, `is_order_artisan`, `can_read_sub_order`, `has_sub_order_with_artisan`, `can_review_product` (STABLE, SECURITY DEFINER). | Ils évitent la récursion entre les politiques `orders` ↔ `sub_orders` et la lecture de `profiles` (non publique) depuis la RLS. |
| D-16 | Contournement des protections RM-9 | Les triggers de protection laissent passer : l'admin connecté, le SQL Editor (`postgres`), la clé secrète (`service_role`) et les fonctions SECURITY DEFINER. Seuls les rôles `anon` et `authenticated` sont contrôlés. | Permet `update profiles set role='admin'` dans le SQL Editor (guide d'installation) et le script de seed. |
| D-17 | Colonnes protégées en plus de RM-9 | `profiles.email` (synchronisé depuis `auth.users` par trigger), `artisan_profiles.slug` et `approved_at`, `products.slug`, `artisan_id` et `views_count`, `reviews.product_id` et `client_id`. | Cohérence des URL et des données. |
| D-18 | Refus d'un artisan | `rejection_reason` est **obligatoire** pour passer en `rejected`. Il est effacé automatiquement dès que le statut change. `approved_at` est renseigné automatiquement. | ADM-2 (« motif obligatoire ») et ART-1 (resoumission). |
| D-19 | Statuts finaux | `delivered` et `cancelled` sont **définitifs pour tout le monde**, admin compris. L'admin peut faire n'importe quelle autre transition. | Évite de redécrémenter le stock après une annulation. RM-6 interdit déjà d'annuler une commande livrée. |
| D-20 | Motif d'annulation | Obligatoire pour l'artisan (ART-7), facultatif pour le client et l'admin. Il est enregistré dans `sub_orders.cancel_reason` et dans l'historique. | Cahier ART-7. |
| D-21 | Téléphone de livraison | `place_order` retire les espaces, points et tirets, puis exige exactement 8 chiffres. | PAN-4. |
| D-22 | Garde-fous en base | Un trigger bloque la suppression d'un produit déjà commandé (ART-5). Un autre limite à 5 images par produit (ART-4). Supprimer une catégorie utilisée est bloqué par la FK `RESTRICT`, avec un message français (ADM-5). | La sécurité et l'intégrité ne reposent pas sur l'UI. |
| D-23 | `orders.client_id` | Pas de `ON DELETE CASCADE` : on désactive un compte plutôt que de le supprimer. | Conserve l'historique des commandes. |
| D-24 | `app_settings` | La ligne `id = 1` est créée dans la migration, puis complétée par `seed.sql`. | `place_order` en a besoin même si le seed n'a pas été joué. |
| D-25 | `npm run db:push` | Lancé avec **`--remote --include-seed`**. La CLI v3 cible la base locale (Docker) par défaut, d'où `--remote` ; `db:types` utilise aussi `--remote`, car `--linked` n'existe plus en v3 : les catégories sont insérées lors du push. `seed.sql` est idempotent. | Sans ce flag, `db push` n'exécute pas `seed.sql`. |
| D-26 | Chiffre d'affaires | Somme des `total` des sous-commandes `delivered`, frais de livraison inclus (ce que l'artisan encaisse). | Non précisé par le cahier. |
| D-27 | Vue `product_ratings` | `security_invoker = true` : la RLS de `reviews` s'applique à l'utilisateur qui lit la vue. | Bonne pratique Supabase. |
| D-28 | Storage | Les 4 buckets sont limités à 2 Mo et aux formats jpg, png et webp. `shop-assets` est ouvert à tout artisan, même non approuvé. | ART-1 : un artisan en attente peut modifier sa boutique. |
| D-29 | `updated_at` | `set_updated_at()` ignore les mises à jour qui ne touchent que `views_count`. | Une simple vue ne doit pas « modifier » le produit. |
| D-30 | Tests de la base | `npm run db:test` exécute les migrations, le seed et 101 scénarios (RLS, RPC, triggers, storage) dans **PGlite** (Postgres en WebAssembly, devDependency), avec des bouchons pour `auth` et `storage`. | Pas de Docker sur le poste. Cela permet de valider le SQL avant `db push`. |
| D-31 | Nom des auteurs d'avis | `profiles` n'est pas lisible publiquement. L'affichage du nom des auteurs d'avis sera traité en Phase 7 (vue ou colonne dédiée). | Ne pas exposer email et téléphone. |
| D-32 | Droits (GRANT) explicites | La migration `grants` accorde le strict nécessaire : `anon` en lecture sur le catalogue ; `authenticated` en lecture partout, et en écriture seulement là où une politique RLS l'autorise ; aucune écriture directe sur les tables de commande ; `service_role` a tout. Les fonctions helpers et les RPC sont accordées explicitement. `db:test` ne donne plus aucun droit par défaut. | Les projets Supabase récents n'accordent plus automatiquement les droits aux rôles `anon` et `authenticated`. Constaté après le premier push : « permission denied for table ». |

## Phase 2 — Authentification

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D-33 | État de session | Store Zustand `src/stores/auth.ts` alimenté par `onAuthStateChange` (`initAuth()` dans `main.tsx`), sans Context React. Le profil (avec la boutique, via `artisan_profiles(*)`) est chargé par TanStack Query dans `useProfile`. | Simple et sans provider. Une seule requête pour le profil et la boutique. |
| D-34 | Redirection après connexion ou inscription | Elle est faite par `GuestOnlyRoute` dès que le profil est chargé, et non par les pages elles-mêmes : une seule source de vérité (`postLoginPath`). Le paramètre `?redirect=` n'est suivi que pour un client, et uniquement vers un chemin interne. | Respecte AUTH-3 et évite les redirections ouvertes. |
| D-35 | Compte désactivé (AUTH-6) | `RootLayout` déconnecte l'utilisateur dès que son profil indique `is_active = false`, à la connexion ou lors d'un rafraîchissement (au retour sur l'onglet, et toutes les 60 s). Les RPC et la RLS refusent déjà tout à un compte désactivé. | Pas de Realtime nécessaire. |
| D-36 | Gardes de routes | `RequireRole roles=[…]` (+ `requireApproved` pour l'artisan) enveloppe chaque espace. Visiteur → `/connexion?redirect=…` ; mauvais rôle → page d'accueil de son propre espace. Ce n'est qu'un confort d'interface : la sécurité reste assurée par la RLS. | AUTH-7. |
| D-37 | Artisan non approuvé | `/artisan/en-attente` et `/artisan/boutique` sont dans l'espace artisan, avec un menu réduit. Les autres pages exigent `approved`. Un artisan **suspendu** n'y accède pas non plus : il voit ses sous-commandes en cours au niveau des données (RLS), mais pas dans l'interface en V1. | ART-1 (« il n'accède qu'à cette page et à `/artisan/boutique` »). |
| D-38 | Resoumission (artisan refusé) | Le bouton « Modifier ma boutique et resoumettre » repasse le statut à `pending` (autorisé par le trigger RM-9) puis ouvre `/artisan/boutique`. | ART-1, en une seule action. |
| D-39 | Messages d'erreur | `src/lib/errors.ts` traduit les codes Supabase Auth et les erreurs Postgres natives. Les exceptions levées par nos fonctions SQL, déjà en français, sont affichées telles quelles. « Mot de passe oublié » affiche le même message que le compte existe ou non. | UI 100 % française. Pas de fuite d'information sur l'existence des comptes. |
| D-40 | Formulaires | `TextField` et `SelectField` (`<select>` natif via shadcn `native-select`) avec label, aide et erreur reliés par `aria-describedby`. Mot de passe : 8 caractères minimum. Téléphone : 8 chiffres, espaces, points ou tirets tolérés puis retirés à l'envoi. | Accessibilité, sélecteur natif sur mobile. Cohérent avec `place_order`. |
| D-41 | Confirmation d'email | Gérée si elle est réactivée : l'inscription affiche alors « Vérifiez votre boîte mail » au lieu de rediriger. | Le code reste valide quel que soit le réglage Supabase. |
