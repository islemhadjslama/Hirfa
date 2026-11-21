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

## Phase 3 — Espace artisan (boutique et produits)

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D-42 | Compression d'images | `browser-image-compression` avec **`useWebWorker: false`**. Conversion en WebP (1600 px max, 600 px pour le logo, 1800 px pour la bannière) ; refus au-delà de 2 Mo après compression ; formats acceptés : jpg, png, webp. | Avec un Web Worker, la librairie charge son script depuis `cdn.jsdelivr.net`. On évite cette dépendance externe ; la compression de 5 images au plus reste rapide (environ 1 s pour une photo de 19 Mo). |
| D-43 | Envoi des images | Les images sont compressées dès qu'on les choisit (aperçu local), puis envoyées **à l'enregistrement** dans `product-images/{uid}/{productId}/{uuid}.webp`. Ordre des opérations : produit → suppression des images retirées (libère des places dans la limite de 5) → mise à jour de l'ordre → ajouts → nettoyage des fichiers retirés. | Rien n'est envoyé si l'utilisateur abandonne le formulaire. |
| D-44 | Échec partiel | Si le produit est créé mais qu'une image échoue, l'utilisateur est redirigé vers la page de modification avec un message, et le formulaire repart de l'état enregistré en base. | Pas de transaction possible entre Postgres et Storage. |
| D-45 | Réordonner les images | Boutons ← / → / ★ (« image principale ») plutôt qu'un glisser-déposer. La position 0 correspond à l'image principale. | Utilisable au clavier et sur mobile, sans dépendance supplémentaire. |
| D-46 | Suppression (ART-5) | L'application tente le `DELETE`. Si le trigger le refuse (code `23503`, produit déjà commandé), elle passe le produit en `draft` et explique pourquoi. Les fichiers Storage d'un produit supprimé sont nettoyés. Une confirmation est demandée avant de supprimer. | La règle est appliquée par la base, l'interface ne fait que s'adapter. |
| D-47 | Liste des produits (ART-3) | Tous les produits de l'artisan sont chargés en une seule requête, avec leurs images. Recherche (insensible aux accents) et filtre de statut côté client. Tableau sur ordinateur, cartes sur mobile. | Un artisan a peu de produits ; pas besoin de pagination serveur ici. |
| D-48 | Logo et bannière | Stockés dans `shop-assets/{uid}/…` ; l'URL publique est enregistrée dans `logo_url` / `banner_url`. L'ancien fichier est supprimé quand on le remplace. | Spécification §6.5. |
| D-49 | WhatsApp | Saisie libre (8 chiffres ou +216…), stocké au format international sans « + » (`21622123456`), prêt pour un lien `wa.me` en Phase 4. | Un seul format en base. |
| D-50 | Artisan refusé | Sur `/artisan/boutique`, le bouton devient « Enregistrer et resoumettre » : la boutique est enregistrée et le statut repasse à `pending` en une seule requête. | ART-1 et ART-2 réunis. |
| D-51 | Prix | Saisie avec virgule ou point, 3 décimales au plus (« 45,500 »), et strictement positif (le `CHECK` en base l'impose aussi). | Habitude tunisienne : DT et millimes. |

## Phase 4 — Catalogue public

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D-52 | Vue `catalog_products` | Nouvelle migration `catalog` : une vue (`security_invoker`) qui applique **RM-1 pour tous les rôles**, admin et propriétaire compris. Elle expose l'image principale, la note moyenne, le nombre d'avis, les slugs de l'artisan et de la catégorie, ainsi que `search_text` (nom + description en minuscules, sans accents). | Tri « mieux notés » (CAT-4) impossible sinon avec PostgREST. Le catalogue n'affiche jamais les brouillons de l'artisan connecté. Une seule requête par page. |
| D-53 | Catégorie désactivée | Ses produits sortent du catalogue (`c.is_active` dans la vue). | Cohérent avec la RLS des catégories (invisibles pour le public). ADM-5 demande de « désactiver » plutôt que supprimer. |
| D-54 | Recherche (CAT-3) | `ilike` sur `search_text` avec le terme normalisé côté client (minuscules, accents retirés, œ → oe), les jokers `%` et `_` saisis étant échappés. | « ceramique » trouve « Céramique ». Suffisant pour le volume d'un projet académique (pas de recherche plein texte). |
| D-55 | Noms des auteurs d'avis | Fonction `product_reviews(p_product_id)` en SECURITY DEFINER : avis non masqués avec un nom abrégé (« Amira S. »), sans id ni email. | Règle D-31 : `profiles` reste privée. |
| D-56 | Accueil (ACC-4) | Produits mis en avant (`is_featured`, 8 max) ; **s'il n'y en a aucun**, on affiche les 8 dernières créations sous le titre « Dernières créations ». | La page d'accueil n'est jamais vide avant que l'admin ait choisi ses coups de cœur. |
| D-57 | Artisans récents (ACC-5) | Les 6 artisans approuvés triés par `approved_at` décroissant. | « Plus récents » = arrivés le plus récemment sur le catalogue. |
| D-58 | Filtres et URL | Paramètres de §7 : `q, categorie, min, max, gouvernorat, artisan, stock=1, tri, page`. Valeurs de `tri` : `recent` (défaut, absent de l'URL), `prix-croissant`, `prix-decroissant`, `note`. Toute modification de filtre revient en page 1. Les filtres actifs s'affichent en puces qu'on peut retirer une à une. `/artisans` utilise `gouvernorat` et `specialite` (slug de catégorie). | CAT-2, CAT-7. Liens partageables. |
| D-59 | Pagination | Côté serveur avec `.range()` et `count: 'exact'`, 12 par page (12 artisans aussi). Une page au-delà du dernier résultat affiche un état vide avec un lien vers la page 1. Les données précédentes restent affichées pendant le chargement. | §8 (performance). |
| D-60 | Boutique publique (CAT-8) | Tous les produits visibles de l'artisan sont chargés (200 max), affichés par 12 avec un bouton « Voir plus ». La note de la boutique est la moyenne des notes produits pondérée par le nombre d'avis. Seules les boutiques `approved` sont accessibles (sinon page « Boutique introuvable »). Lien WhatsApp : `https://wa.me/{numéro}`. | Le nombre de produits et la note demandés par CAT-8 viennent ainsi d'une seule requête. |
| D-61 | « Ajouter au panier » | Affiché sur la fiche produit (désactivé en rupture) avec le sélecteur de quantité de 1 au stock. En attendant la Phase 5, il affiche « Le panier sera bientôt disponible ». | Le panier (PAN-1) appartient à la Phase 5. |
| D-62 | Favoris sur les cartes (CAT-5) | Le bouton cœur fonctionne dès maintenant : visiteur → `/connexion?redirect=…` ; client → ajout ou retrait (mise à jour optimiste) ; artisan ou admin → message « réservés aux clients ». La page `/compte/favoris` reste en Phase 7. | CAT-5 et CLI-5. Les tables et la RLS existent déjà. |
| D-63 | Compteur de vues | `increment_product_view` est appelé une fois par affichage de fiche (garde par `useRef`, compatible StrictMode). | CAT-6. La fonction SQL ignore le propriétaire. |
| D-64 | Icônes réseaux sociaux | Lucide 1.x ne fournit plus les logos de marques : libellés « Facebook », « Instagram », « WhatsApp » avec une icône de lien. | Pas de dépendance ni de logo téléchargé. |

## Phase 5 — Panier et commande

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D-65 | Stockage du panier | Zustand `persist` dans `localStorage` (clé `hirfa-cart`, version 1). Chaque ligne garde un instantané du produit (nom, prix, image, artisan, stock) et la quantité. Le panier n'est pas lié au compte et n'est pas vidé à la déconnexion. | PAN-1 : panier accessible sans compte. |
| D-66 | Fraîcheur des données | À l'affichage du panier et du checkout, les produits sont relus dans `catalog_products` (RM-1). Prix, nom et stock sont mis à jour dans le store, et les quantités ramenées au stock disponible. Un produit absent de la vue (masqué, brouillon, artisan suspendu…) ou en rupture est signalé, et la commande reste bloquée tant qu'il est dans le panier. | Évite une erreur évitable au moment de commander. Le serveur revérifie de toute façon (place_order). |
| D-67 | Quantités | Plafonnées au stock connu, à l'ajout comme dans le panier. La fiche produit indique « Déjà N dans votre panier » et ne propose que la quantité restante. | PAN-2 : « dans la limite du stock ». |
| D-68 | Totaux affichés | Calculés côté client (frais de livraison × nombre d'artisans ayant au moins une ligne commandable). Ils restent **indicatifs** : `place_order` recalcule tout avec les prix et les frais du moment. | RM-3 : le serveur fait foi. |
| D-69 | PAN-3 | Un visiteur qui clique « Passer la commande » est envoyé vers `/connexion?redirect=%2Fcommande`. Un artisan ou un admin voit « Seuls les clients peuvent commander » et le bouton est désactivé. La route `/commande` reste protégée par `RequireRole client`. | Message demandé par PAN-3, sécurité par la RPC. |
| D-70 | Checkout | Formulaire pré-rempli depuis le profil (nom, téléphone, gouvernorat, ville, adresse), téléphone normalisé à 8 chiffres. L'adresse par défaut du profil n'est **pas** modifiée par la commande (elle se modifie dans `/compte`, Phase 7). | PAN-4, CLI-1. |
| D-71 | Erreur de commande | Le message de la RPC (déjà en français, nommant le produit) s'affiche en haut du formulaire, et le panier est conservé. Après la commande, qu'elle réussisse ou échoue, le catalogue, les fiches produit et le panier sont rafraîchis, car le stock a changé. | PAN-5. |
| D-72 | Après succès | Redirection vers `/commande/confirmation/:id` (avec `replace`, pour qu'un retour arrière ne renvoie pas le formulaire), **puis** vidage du panier. La page de confirmation relit la commande en base (numéro, colis par artisan, totaux, adresse, prochaines étapes). | PAN-6. |

## Phase 6 — Suivi des commandes

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D-73 | Changements de statut | Uniquement via la RPC `update_sub_order_status` (Phase 1). Aucune règle de transition n'est recodée côté client pour la sécurité : l'UI ne fait qu'afficher les boutons autorisés (étape suivante, annulation). En cas de refus (statut modifié entre-temps), le message de la RPC s'affiche et la page est relue. | CLAUDE.md, RM-6. |
| D-74 | Boutons de l'artisan (ART-7) | Un seul bouton « étape suivante » avec un libellé d'action (« Confirmer la commande », « Commencer la préparation », « Marquer comme expédiée », « Marquer comme livrée ») + « Annuler la commande » tant que le statut est `pending`, `confirmed` ou `preparing`. | Évite les sauts d'étape, cohérent avec RM-6. |
| D-75 | Motif d'annulation | Boîte de dialogue de confirmation : motif **obligatoire pour l'artisan** (3 caractères minimum, également exigé par la RPC), **facultatif pour le client**. Le motif est visible par l'autre partie dans l'historique. | ART-7, CLI-4, confirmation avant action destructive (§8). |
| D-76 | Historique (CLI-3) | Barre de progression des 5 étapes (ou « Commande annulée ») + historique chronologique avec date, note et auteur. L'auteur est déduit de `changed_by` : « par vous », « par le client », « par {boutique} » ou « par l'administration », sans lire la table `profiles`. | Timeline demandée par CLI-3, sans exposer de données personnelles. |
| D-77 | Listes | Client : 10 commandes par page (numéro, date, total, statut de chaque colis). Artisan : 15 sous-commandes par page, filtre `?statut=` dans l'URL, tableau sur ordinateur, cartes sur mobile. Les requêtes filtrent explicitement par `client_id` / `artisan_id` en plus de la RLS. | CLI-2, ART-6. La RLS laisse un artisan lire les commandes parentes : le filtre évite de les mélanger. |
| D-78 | Fraîcheur | Les pages de commande sont relues au retour sur l'onglet, et après chaque changement de statut (commande, listes, catalogue et produits de l'artisan, puisqu'une annulation restaure le stock). | Pas de temps réel nécessaire pour un projet académique. |

## Phase 7 — Favoris, avis, compte client

| # | Sujet | Décision | Raison |
|---|---|---|---|
| D-79 | Pas de nouvelle migration | Les tables `reviews` et `favorites`, leur RLS, `can_review_product` et les triggers de protection existent depuis la Phase 1. ART-9 obtient les noms d'auteurs via `product_reviews()` (Phase 4), produit par produit. | Pas de nouveau `db push` ; un artisan a peu de produits notés. |
| D-80 | Où laisser un avis (CLI-6) | À deux endroits : le bloc « Votre avis » de la fiche produit (formulaire si `can_review_product` est vrai, sinon « Vous pourrez donner votre avis après l'avoir reçu ») et un bouton « Donner / Modifier mon avis » sur chaque article d'un colis **livré**, dans le détail de commande. La RLS refuse de toute façon un avis non éligible. | Parcours naturels après une livraison. |
| D-81 | Avis existant | Un seul avis par produit : s'il existe, on le modifie (note, commentaire) ou on le supprime après confirmation. Un avis masqué par l'admin reste visible pour son auteur, avec la mention « masqué par la modération ». Une tentative de doublon (code 23505) donne un message clair. | CLI-6, RM-8. |
| D-82 | Saisie de la note | Cinq boutons radio présentés en étoiles (clavier, lecteurs d'écran, libellés « Décevant » → « Excellent »). Note obligatoire, commentaire facultatif (1 000 caractères maximum). | Accessibilité (§8). |
| D-83 | Favoris (CLI-5) | La page relit les produits dans `catalog_products`. Un favori devenu invisible (masqué, artisan suspendu…) est signalé à part, avec un bouton « Retirer ». On retire un favori avec le cœur de la carte. | RM-1 : le client ne peut plus voir ces produits. |
| D-84 | Profil (CLI-1) | Nom, téléphone (8 chiffres) et adresse par défaut (gouvernorat, ville, adresse, tous facultatifs) mis à jour sur `profiles` ; les colonnes protégées ne sont jamais envoyées (trigger RM-9 en garde-fou). L'email est affiché en lecture seule. | L'adresse par défaut pré-remplit le checkout (D-70). |
| D-85 | Mot de passe (CLI-1) | Le **mot de passe actuel est vérifié** (`signInWithPassword`) avant `updateUser`. Le nouveau doit être différent de l'ancien, avec 8 caractères minimum. | Une session restée ouverte ne suffit pas à changer le mot de passe. |
| D-86 | Navigation du compte | Onglets « Mon profil / Mes commandes / Mes favoris » en haut des trois pages client, défilants horizontalement sur mobile. | Espace client cohérent sans layout dédié. |
| D-87 | Avis reçus (ART-9) | Lecture seule : moyenne, répartition 1–5 étoiles, filtre par produit et liste (produit, note, auteur abrégé, date). Les avis masqués sont exclus par la RLS. | ART-9. |
