# Cahier des charges — **Hirfa**
### Vitrine électronique / marketplace des artisans tunisiens

> Version 1.0 — 21/11/2026 — Projet académique / portfolio
> Document de référence destiné à Claude Code. Toute décision technique doit respecter ce document. En cas d'ambiguïté, choisir la solution la plus simple qui respecte les règles métier, et la noter dans `DECISIONS.md`.

---

## 1. Présentation du projet

### 1.1 Contexte
Les artisans tunisiens (potiers, tisserands, bijoutiers, maroquiniers…) vendent surtout sur les marchés locaux ou via les réseaux sociaux, sans vitrine structurée. **Hirfa** (« métier artisanal » en arabe) leur offre une boutique en ligne gratuite, et aux clients un catalogue unique pour acheter directement auprès d'eux.

### 1.2 Objectifs
- Permettre à chaque artisan d'avoir un **profil-boutique** et de publier ses produits.
- Permettre au client de **parcourir, rechercher et commander** des produits de plusieurs artisans en une seule commande.
- Permettre à un **administrateur** de valider les artisans, modérer le contenu et superviser toutes les commandes.

### 1.3 Décisions fonctionnelles validées
| Sujet | Décision |
|---|---|
| Paiement | **Paiement à la livraison uniquement.** Aucun paiement en ligne. |
| Commission | **Aucune.** |
| Panier multi-artisans | **Oui.** Une commande est découpée en **une sous-commande par artisan**. |
| Livraison | **Tarif unique** fixé par l'admin dans les paramètres, appliqué **par sous-commande** (chaque artisan expédie son propre colis). |
| Langue | **Français uniquement.** |
| Devise | Dinar tunisien (**TND**), 3 décimales. Affichage : `45,000 DT`. |
| Variantes produit (taille/couleur) | **Hors périmètre V1.** |

---

## 2. Acteurs et rôles

| Rôle | Description |
|---|---|
| **Visiteur** | Non connecté. Peut parcourir le catalogue, les boutiques, et remplir un panier. |
| **Client** | Compte `client`. Peut commander, suivre ses commandes, gérer ses favoris, laisser des avis. |
| **Artisan** | Compte `artisan`. Doit être **approuvé par l'admin** avant de pouvoir publier. Gère sa boutique, ses produits et ses sous-commandes. |
| **Administrateur** | Compte `admin`. Gère tout : artisans, clients, produits, catégories, commandes, avis, paramètres. Ne peut pas s'inscrire via l'interface (créé par le seed ou en SQL). |

Un utilisateur a **un seul rôle**.

---

## 3. Stack technique

| Couche | Choix |
|---|---|
| Frontend | **React + TypeScript + Vite** (SPA) |
| Routing | **React Router** (mode librairie) |
| Données serveur | **TanStack Query** + **supabase-js v2** |
| État local | **Zustand** (panier persistant dans `localStorage`) |
| UI | **Tailwind CSS** + **shadcn/ui** + **lucide-react** + **sonner** (toasts) |
| Formulaires | **React Hook Form** + **Zod** (messages d'erreur en français) |
| Graphiques | **Recharts** (tableaux de bord) |
| Backend | **Supabase** : PostgreSQL, Auth, Storage, RLS, fonctions SQL (RPC) |
| Migrations | **Supabase CLI** via `npx supabase` : fichiers SQL dans `supabase/migrations/` |
| Types | Générés : `npx supabase gen types typescript` → `src/types/database.ts` |
| Images | Compression côté client avant upload (`browser-image-compression`) |

Il n'y a **pas de serveur backend custom**. Toute la logique sensible (création de commande, changement de statut, stock) est faite dans des **fonctions PostgreSQL** appelées en RPC. La sécurité repose sur la **RLS** (Row Level Security) activée sur **toutes** les tables.

Utiliser les **dernières versions stables** des librairies. Consulter leur documentation actuelle en cas de doute (Tailwind v4 + plugin Vite, shadcn compatible Tailwind v4, etc.).

---

## 4. Besoins fonctionnels

Format : **ID — En tant que…, je veux… (critères d'acceptation)**.

### 4.1 Page d'accueil (publique)
- **ACC-1** — Hero présentant le but du site : « Achetez directement auprès des artisans tunisiens », avec un sous-titre et un visuel.
- **ACC-2** — Deux grandes cartes de choix :
  - **« Je suis artisan »** : si connecté en tant qu'artisan → `/artisan` ; sinon → `/artisan/inscription` (avec un lien « J'ai déjà un compte »).
  - **« Je suis client »** → `/catalogue`.
- **ACC-3** — Grille des catégories (image + nom) → `/catalogue?categorie=slug`.
- **ACC-4** — Produits mis en avant (`is_featured`), 8 maximum.
- **ACC-5** — Artisans mis en avant : les 6 plus récents parmi les approuvés.
- **ACC-6** — Section « Comment ça marche » : Choisissez → Commandez → Payez à la livraison.
- **ACC-7** — Footer : liens, contact, mention du projet académique.

### 4.2 Authentification
- **AUTH-1** — Inscription **client** (`/inscription`) : nom complet, email, téléphone, mot de passe + confirmation.
- **AUTH-2** — Inscription **artisan** (`/artisan/inscription`) : nom complet, email, téléphone, mot de passe, **nom de la boutique**, **spécialité** (catégorie principale), **gouvernorat**. Après l'inscription, le compte est en statut `pending` et l'artisan est redirigé vers `/artisan/en-attente`.
- **AUTH-3** — Connexion unique (`/connexion`). Redirection selon le rôle : client → page précédente ou `/catalogue` ; artisan → `/artisan` (ou `/artisan/en-attente` s'il n'est pas approuvé) ; admin → `/admin`.
- **AUTH-4** — Mot de passe oublié et réinitialisation via email (Supabase Auth).
- **AUTH-5** — Déconnexion.
- **AUTH-6** — Un compte désactivé (`is_active = false`) est déconnecté immédiatement, avec le message « Votre compte a été désactivé. Contactez l'administrateur. »
- **AUTH-7** — Gardes de routes par rôle. Un accès non autorisé redirige vers `/connexion` ou vers l'espace du rôle.

### 4.3 Catalogue et navigation (publique)
- **CAT-1** — `/catalogue` : grille de produits paginée (12 par page). Seuls les produits **publiés**, **non masqués par l'admin**, appartenant à un **artisan approuvé**.
- **CAT-2** — Filtres combinables, synchronisés avec l'URL : catégorie, prix min/max, gouvernorat de l'artisan, artisan, « en stock uniquement ».
- **CAT-3** — Recherche texte sur le nom et la description (barre de recherche dans le header).
- **CAT-4** — Tri : plus récents, prix croissant, prix décroissant, mieux notés.
- **CAT-5** — Carte produit : image, nom, prix, nom de l'artisan, note moyenne, badge « Rupture » si le stock vaut 0, bouton favori.
- **CAT-6** — Page produit `/produits/:slug` : galerie d'images, prix, stock disponible, description, catégorie, encart artisan (logo, nom, ville, lien vers la boutique), sélecteur de quantité (de 1 au stock), bouton « Ajouter au panier » (désactivé si rupture), avis et note moyenne, puis « Autres produits de cet artisan ». Le nombre de vues est incrémenté (sauf pour l'artisan propriétaire).
- **CAT-7** — `/artisans` : liste des artisans approuvés, avec filtres par gouvernorat et par spécialité.
- **CAT-8** — Boutique `/artisans/:slug` : bannière, logo, nom, bio, spécialité, ville, liens sociaux et WhatsApp (s'ils sont renseignés), date d'inscription, nombre de produits, note moyenne, puis la grille de ses produits.
- **CAT-9** — États vides, squelettes de chargement et page 404 en français.

### 4.4 Panier et commande (client)
- **PAN-1** — Panier stocké localement (Zustand + `localStorage`), accessible **sans compte**. Icône avec le nombre d'articles dans le header.
- **PAN-2** — `/panier` : articles **groupés par artisan**. Pour chaque artisan : ses lignes, son sous-total et ses frais de livraison. En bas : le total général. On peut modifier les quantités (dans la limite du stock) et supprimer des articles.
- **PAN-3** — « Passer la commande » : si non connecté → `/connexion?redirect=/commande`. Si le compte connecté est artisan ou admin → message « Seuls les clients peuvent commander ».
- **PAN-4** — Checkout `/commande` : formulaire de livraison (nom complet, téléphone tunisien à 8 chiffres, gouvernorat, ville, adresse, note facultative), pré-rempli depuis le profil. Récapitulatif complet. Mention « **Paiement à la livraison** ».
- **PAN-5** — La validation appelle la RPC `place_order`, qui vérifie le stock, crée la commande et les sous-commandes, et décrémente le stock, **en une seule transaction**. En cas d'erreur (stock insuffisant, produit indisponible) : message clair nommant le produit concerné, et le panier est conservé.
- **PAN-6** — Après succès : le panier est vidé et le client est redirigé vers `/commande/confirmation/:id` (numéro de commande, résumé, prochaines étapes).

### 4.5 Espace client
- **CLI-1** — `/compte` : modifier nom, téléphone, adresse de livraison par défaut (gouvernorat, ville, adresse) et mot de passe.
- **CLI-2** — `/compte/commandes` : liste des commandes (numéro, date, total, statut de chaque sous-commande).
- **CLI-3** — `/compte/commandes/:id` : détail par sous-commande (artisan, articles, statut, **timeline de l'historique des statuts**).
- **CLI-4** — Annuler une sous-commande **tant qu'elle est `pending`**. Le stock est restauré.
- **CLI-5** — `/compte/favoris` : produits favoris. Ajout et retrait depuis les cartes et la page produit (si non connecté → connexion).
- **CLI-6** — Laisser **un avis** (note de 1 à 5 + commentaire facultatif) sur un produit **seulement s'il fait partie d'une sous-commande `delivered`** du client. Un seul avis par produit et par client. Modifiable et supprimable par son auteur.

### 4.6 Espace artisan
- **ART-1** — `/artisan/en-attente` : affiche le statut du compte.
  - `pending` : « En cours de validation ».
  - `rejected` : motif du refus, plus un bouton « Modifier ma boutique et resoumettre » (le statut repasse à `pending`).
  - `suspended` : message de suspension.

  Tant que l'artisan n'est pas `approved`, il n'accède qu'à cette page et à `/artisan/boutique`.
- **ART-2** — `/artisan/boutique` : modifier nom de la boutique, bio, spécialité, gouvernorat, ville, adresse, logo, bannière, Facebook, Instagram, WhatsApp. Lien « Voir ma boutique publique ».
- **ART-3** — `/artisan/produits` : tableau de ses produits (image, nom, prix, stock, statut, vues), avec recherche et filtre par statut. Badge « Masqué par l'admin » si c'est le cas.
- **ART-4** — Créer ou modifier un produit : nom, description, catégorie, prix (TND), stock, statut (`draft` ou `published`), de **1 à 5 images** (réordonnables, première = image principale, 2 Mo max après compression, formats jpg/png/webp).
- **ART-5** — Supprimer un produit : suppression définitive s'il n'a jamais été commandé, sinon passage en brouillon (`draft`) avec un message explicatif.
- **ART-6** — `/artisan/commandes` : ses sous-commandes (numéro, date, client, total, statut), avec filtre par statut.
- **ART-7** — `/artisan/commandes/:id` : détail (articles, coordonnées de livraison du client, note) et boutons de transition de statut :
  `pending → confirmed → preparing → shipped → delivered`.
  Annulation possible depuis `pending`, `confirmed` ou `preparing`, **motif obligatoire**. Le stock est restauré.
- **ART-8** — Tableau de bord `/artisan` :
  - indicateurs : chiffre d'affaires (sous-commandes `delivered`), commandes en attente, nombre de produits publiés, note moyenne ;
  - graphique des ventes des 6 derniers mois ;
  - top 5 des produits vendus ;
  - 5 dernières commandes.
- **ART-9** — `/artisan/avis` : avis reçus sur ses produits (lecture seule).

### 4.7 Espace administrateur
- **ADM-1** — Tableau de bord `/admin` :
  - indicateurs : nombre de clients, artisans (par statut), produits, commandes, chiffre d'affaires total livré ;
  - graphique des commandes par mois (6 mois) ;
  - liste des artisans en attente de validation.
- **ADM-2** — `/admin/artisans` : liste filtrable par statut. Actions : **approuver**, **refuser** (motif obligatoire), **suspendre** et **réactiver**. Page de détail avec ses produits et ses commandes.
- **ADM-3** — `/admin/clients` : liste avec recherche. **Activer / désactiver** un compte. Détail avec ses commandes.
- **ADM-4** — `/admin/produits` : tous les produits avec filtres (artisan, catégorie, statut). Actions : **masquer / démasquer** (`admin_hidden`), **mettre en avant** (`is_featured`).
- **ADM-5** — `/admin/categories` : CRUD (nom, slug automatique, description, image, ordre d'affichage, actif/inactif). Impossible de supprimer une catégorie qui contient des produits : il faut la désactiver.
- **ADM-6** — `/admin/commandes` : toutes les commandes, avec filtres par statut, artisan et date. Le détail permet de changer le statut de n'importe quelle sous-commande (y compris annuler).
- **ADM-7** — `/admin/avis` : masquer, afficher ou supprimer un avis.
- **ADM-8** — `/admin/parametres` : **frais de livraison par sous-commande** (TND), nom et email de contact du site.

---

## 5. Règles métier

1. **RM-1** — Un produit est visible publiquement si et seulement si `status = 'published'` ET `admin_hidden = false` ET son artisan a `status = 'approved'` ET le compte de l'artisan est actif.
2. **RM-2** — Un artisan non approuvé ne peut pas créer de produit.
3. **RM-3** — Commande : les articles sont groupés par `artisan_id`. Chaque groupe devient une `sub_order`, avec `shipping_fee` = frais de livraison du moment (copiés dans la ligne). `order.total = Σ sub_order.total`.
4. **RM-4** — Le prix et le nom du produit sont **copiés** dans `order_items` au moment de la commande (snapshot).
5. **RM-5** — Le stock est décrémenté à la commande et **restauré à l'annulation**. La vérification du stock utilise `SELECT … FOR UPDATE` pour éviter les ventes en double.
6. **RM-6** — Transitions de statut autorisées :

   | Acteur | Transitions |
   |---|---|
   | Client | `pending → cancelled` |
   | Artisan (propriétaire) | `pending→confirmed→preparing→shipped→delivered` ; annulation depuis `pending/confirmed/preparing` |
   | Admin | toute transition, y compris l'annulation depuis tout statut sauf `delivered` |

   Chaque changement est inscrit dans `sub_order_status_history`.
7. **RM-7** — Un client désactivé ne peut pas commander. Un artisan suspendu ou désactivé : ses produits disparaissent du catalogue, mais ses sous-commandes en cours restent visibles par lui-même et par l'admin.
8. **RM-8** — Avis : il faut une sous-commande `delivered` du client contenant le produit. Un seul avis par couple (produit, client). La note moyenne exclut les avis masqués.
9. **RM-9** — Personne d'autre que l'admin ne peut modifier : `profiles.role`, `profiles.is_active`, `artisan_profiles.status`, `rejection_reason`, `products.admin_hidden`, `products.is_featured`. Exception : l'artisan peut passer de `rejected` à `pending`. À garantir par des **triggers** côté base.
10. **RM-10** — Numéro de commande lisible : `HRF-AAAAMMJJ-00001` (généré par une séquence).

---

## 6. Modèle de données (PostgreSQL / Supabase)

### 6.1 Types énumérés
```sql
user_role:         'client' | 'artisan' | 'admin'
artisan_status:    'pending' | 'approved' | 'rejected' | 'suspended'
product_status:    'draft' | 'published'
sub_order_status:  'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
```

### 6.2 Tables

**profiles** — 1 ligne par utilisateur (créée par un trigger sur `auth.users`)
| Colonne | Type | Notes |
|---|---|---|
| id | uuid PK | = `auth.users.id`, on delete cascade |
| role | user_role | défaut `client` ; lu depuis `raw_user_meta_data.role` (`client` ou `artisan` uniquement, **jamais `admin`**) |
| full_name | text | |
| email | text | copié depuis auth |
| phone | text | |
| governorate, city, address | text | adresse par défaut (clients) |
| avatar_url | text null | |
| is_active | bool | défaut true |
| created_at, updated_at | timestamptz | |

**artisan_profiles** — créée par un trigger si `role = 'artisan'`
| Colonne | Type | Notes |
|---|---|---|
| id | uuid PK FK profiles | |
| shop_name | text | |
| slug | text unique | généré depuis shop_name (+ suffixe si doublon) |
| bio | text | |
| specialty_category_id | bigint FK categories null | |
| governorate, city, address | text | |
| logo_url, banner_url | text null | |
| facebook_url, instagram_url, whatsapp | text null | |
| status | artisan_status | défaut `pending` |
| rejection_reason | text null | |
| approved_at | timestamptz null | |
| created_at, updated_at | timestamptz | |

**categories**
| id bigint identity PK | name text | slug text unique | description text | image_url text | sort_order int | is_active bool | created_at |

**products**
| Colonne | Type | Notes |
|---|---|---|
| id | bigint identity PK | |
| artisan_id | uuid FK artisan_profiles | |
| category_id | bigint FK categories | |
| name | text | |
| slug | text unique | `slugify(name)-<6 caractères aléatoires>` |
| description | text | |
| price | numeric(10,3) | > 0 |
| stock | int | ≥ 0 |
| status | product_status | défaut `draft` |
| admin_hidden | bool | défaut false |
| is_featured | bool | défaut false |
| views_count | int | défaut 0 |
| created_at, updated_at | timestamptz | |

**product_images**
| id bigint PK | product_id FK on delete cascade | path text (chemin Storage) | position int |

**favorites**
| client_id uuid FK profiles | product_id bigint FK products on delete cascade | created_at | PK(client_id, product_id) |

**orders**
| Colonne | Type |
|---|---|
| id | bigint identity PK |
| order_number | text unique |
| client_id | uuid FK profiles |
| shipping_full_name, shipping_phone, shipping_governorate, shipping_city, shipping_address | text |
| notes | text null |
| subtotal, shipping_total, total | numeric(10,3) |
| created_at | timestamptz |

**sub_orders**
| Colonne | Type |
|---|---|
| id | bigint identity PK |
| order_id | bigint FK orders on delete cascade |
| artisan_id | uuid FK artisan_profiles |
| status | sub_order_status, défaut `pending` |
| subtotal, shipping_fee, total | numeric(10,3) |
| cancel_reason | text null |
| created_at, updated_at | timestamptz |

**order_items**
| id bigint PK | sub_order_id FK on delete cascade | product_id bigint FK products **on delete set null** | product_name text | unit_price numeric(10,3) | quantity int > 0 | line_total numeric(10,3) |

**sub_order_status_history**
| id bigint PK | sub_order_id FK | status sub_order_status | note text null | changed_by uuid FK profiles | created_at |

**reviews**
| id bigint PK | product_id FK on delete cascade | client_id uuid FK | rating smallint 1–5 | comment text null | is_hidden bool défaut false | created_at, updated_at | UNIQUE(product_id, client_id) |

**app_settings** — une seule ligne (`id = 1`, contrainte `CHECK (id = 1)`)
| id int PK | shipping_fee numeric(10,3) défaut 7.000 | site_name text défaut 'Hirfa' | contact_email text | updated_at |

**Vue** `product_ratings` (product_id, avg_rating, reviews_count), qui exclut les avis masqués.

**Index** sur : `products(artisan_id)`, `products(category_id)`, `products(status, admin_hidden)`, `sub_orders(artisan_id, status)`, `orders(client_id)`, `reviews(product_id)`.

### 6.3 Fonctions et triggers SQL
Toutes les fonctions sensibles sont en `SECURITY DEFINER` avec `SET search_path = public`. Elles lèvent des exceptions aux messages **en français**, lisibles par le frontend.

| Nom | Rôle |
|---|---|
| `handle_new_user()` (trigger sur `auth.users`) | Crée `profiles` (+ `artisan_profiles` si artisan) depuis les métadonnées d'inscription. |
| `is_admin()`, `is_approved_artisan()`, `current_role()` | Helpers `STABLE` utilisés par la RLS. |
| `protect_privileged_columns()` (triggers) | Applique RM-9. |
| `set_updated_at()` (triggers) | Met à jour `updated_at`. |
| `place_order(p_items jsonb, p_shipping jsonb) returns bigint` | `p_items = [{product_id, quantity}]`. Vérifie que l'appelant est un client actif, que les produits sont visibles (RM-1) et que le stock est suffisant (FOR UPDATE). Groupe par artisan, crée order + sub_orders + items + historique, décrémente le stock et retourne `order.id`. |
| `update_sub_order_status(p_sub_order_id bigint, p_status sub_order_status, p_note text)` | Applique RM-6, restaure le stock si annulation, écrit l'historique. |
| `increment_product_view(p_product_id bigint)` | +1 vue, sauf pour le propriétaire. |
| `artisan_dashboard_stats()` returns jsonb | Indicateurs ART-8 pour l'artisan appelant. |
| `admin_dashboard_stats()` returns jsonb | Indicateurs ADM-1 (admin uniquement). |
| `generate_order_number()` | Utilise la séquence `order_number_seq`. |

### 6.4 Politiques RLS (résumé)
RLS **activée sur toutes les tables**.

| Table | SELECT | INSERT / UPDATE / DELETE |
|---|---|---|
| profiles | soi-même ; admin | UPDATE soi-même (colonnes protégées par trigger) ; admin tout |
| artisan_profiles | public si `approved` et actif ; soi-même ; client ayant une sous-commande avec cet artisan ; admin | UPDATE soi-même ; admin tout |
| categories | public si `is_active` ; admin tout | admin |
| products | public si RM-1 ; artisan propriétaire ; admin | INSERT/UPDATE/DELETE : artisan propriétaire **approuvé** ; admin |
| product_images | si le produit est visible pour l'utilisateur | artisan propriétaire du produit ; admin |
| favorites | soi-même | soi-même (client) |
| orders | client propriétaire ; artisan ayant une sous-commande dans cette commande ; admin | **aucun accès direct** (uniquement via RPC) |
| sub_orders / order_items / history | client de la commande ; artisan concerné ; admin | **uniquement via RPC** |
| reviews | public si non masqué ; auteur ; admin | INSERT : client éligible (RM-8) ; UPDATE/DELETE : auteur ; admin (masquer/supprimer) |
| app_settings | public | UPDATE admin |

### 6.5 Storage (buckets publics en lecture)
| Bucket | Écriture autorisée |
|---|---|
| `product-images` | artisan approuvé, dans le dossier `{auth.uid()}/…` |
| `shop-assets` (logo, bannière) | artisan, dans le dossier `{auth.uid()}/…` |
| `category-images` | admin |
| `avatars` | utilisateur, dans le dossier `{auth.uid()}/…` |

Les politiques Storage utilisent `(storage.foldername(name))[1] = auth.uid()::text`.

---

## 7. Plan des routes

```
PUBLIC
/                               Accueil
/catalogue                      Catalogue (?q=&categorie=&min=&max=&gouvernorat=&artisan=&stock=1&tri=&page=)
/produits/:slug                 Détail produit
/artisans                       Liste des artisans
/artisans/:slug                 Boutique d'un artisan
/panier                         Panier
/connexion  /inscription        Auth client
/artisan/inscription            Inscription artisan
/mot-de-passe-oublie  /reinitialiser-mot-de-passe

CLIENT (rôle client)
/commande                       Checkout
/commande/confirmation/:id
/compte                         Profil
/compte/commandes               /compte/commandes/:id
/compte/favoris

ARTISAN (rôle artisan)
/artisan/en-attente             (non approuvé)
/artisan/boutique               (accessible même non approuvé)
/artisan                        Tableau de bord        ┐
/artisan/produits               /nouveau  /:id/modifier│ approuvé uniquement
/artisan/commandes              /:id                   │
/artisan/avis                                          ┘

ADMIN (rôle admin)
/admin
/admin/artisans  /admin/artisans/:id
/admin/clients   /admin/clients/:id
/admin/produits
/admin/categories
/admin/commandes /admin/commandes/:id
/admin/avis
/admin/parametres
```

Layouts : `PublicLayout` (header + footer), `ArtisanLayout` et `AdminLayout` (sidebar + topbar, menu repliable sur mobile).

---

## 8. Exigences non fonctionnelles
- **Responsive mobile-first** : toutes les pages sont utilisables dès 360 px de large.
- **UI entièrement en français** : libellés, erreurs Zod, toasts, statuts traduits (`pending` → « En attente », etc.) via un fichier `src/lib/labels.ts`.
- **Formats** : prix via `Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' })` ; dates au format `fr-FR`. Liste des **24 gouvernorats** dans `src/lib/constants.ts`.
- **Sécurité** :
  - la clé `service_role` / secrète n'est **jamais** dans le frontend (pas de préfixe `VITE_`) ;
  - toute règle d'accès est appliquée par la RLS, pas seulement par l'UI ;
  - validation Zod côté client **et** contraintes `CHECK` côté base.
- **UX** : squelettes de chargement, états vides illustrés, toasts de succès et d'erreur, confirmation avant toute action destructive, boutons désactivés pendant les requêtes.
- **Accessibilité** : labels sur tous les champs, `alt` sur les images, contraste suffisant, navigation au clavier.
- **Performance** : pagination côté serveur (`.range()`), images compressées, lazy loading des images et des routes (`React.lazy`).
- **Qualité du code** : TypeScript strict, aucun `any` sans justification, ESLint + Prettier, composants courts, hooks de données dans `src/features/*/api.ts`.

### Direction visuelle
Ambiance chaleureuse et artisanale tunisienne :
- palette : terre cuite `#C2562F`, sable `#F3E9DC`, olive `#6B7A3A`, bleu de Sidi Bou Saïd `#1F5FA8`, encre `#1E1B18` ;
- titres en serif (**Fraunces**), texte en **Inter** (via `@fontsource`) ;
- coins arrondis doux, beaucoup d'espace, photos produits mises en valeur.

---

## 9. Architecture du projet
```
hirfa/
├── CLAUDE.md
├── CAHIER_DES_CHARGES.md
├── DECISIONS.md                 # décisions prises pendant le dev
├── README.md                    # installation + comptes de démo
├── .env.example
├── supabase/
│   ├── config.toml
│   ├── migrations/              # *.sql (schéma, fonctions, RLS, storage)
│   └── seed.sql                 # catégories + app_settings
├── scripts/
│   ├── seed-demo.ts             # comptes + boutiques + produits de démo (clé secrète)
│   └── seed-images/             # images placeholder générées localement (SVG/PNG)
└── src/
    ├── main.tsx  App.tsx  router.tsx
    ├── lib/        supabase.ts  utils.ts  format.ts  labels.ts  constants.ts
    ├── types/      database.ts (généré)
    ├── stores/     cart.ts
    ├── hooks/      useAuth.ts  useProfile.ts
    ├── components/ ui/ (shadcn)  layout/  common/ (ProductCard, Pagination, EmptyState, ImageUploader, StatusBadge…)
    ├── features/   auth/  catalog/  cart/  orders/  artisan/  admin/  reviews/  favorites/
    └── pages/      public/  client/  artisan/  admin/
```

---

## 10. Données de démonstration (`npm run seed`)
Le script `scripts/seed-demo.ts` (exécuté avec `tsx`) utilise la clé secrète, est **idempotent** et crée :
- 1 admin : `admin@hirfa.tn` / `Hirfa2026!`
- 5 artisans : 4 approuvés (poterie à Nabeul, tapis à Kairouan, bijoux à Djerba, cuir à Tunis) et 1 en attente. Format : `artisan1@hirfa.tn` … / `Hirfa2026!`
- 3 clients : `client1@hirfa.tn` … / `Hirfa2026!`
- environ 30 produits répartis, avec des images placeholder **générées localement** (aucun téléchargement externe)
- quelques commandes à différents statuts, et des avis sur les produits livrés

Catégories (dans `seed.sql`) : Poterie & céramique · Tapis & tissage · Bijoux · Cuir & maroquinerie · Vannerie · Bois d'olivier · Broderie & textile · Cuivre & dinanderie · Verre soufflé · Décoration · Savons & cosmétiques naturels.

---

## 11. Plan de développement par phases
Claude Code réalise **une phase à la fois**, puis s'arrête, résume ce qui a été fait et indique comment tester. Il attend la validation avant de passer à la suivante.

| Phase | Contenu | Critère de fin |
|---|---|---|
| **0 — Initialisation** | Projet Vite React TS, Tailwind, shadcn, React Router, TanStack Query, client Supabase, `.env.example`, structure de dossiers, layouts, page d'accueil **statique**, `README.md` | `npm run dev` affiche l'accueil responsive ; `npm run build` passe |
| **1 — Base de données** | Migrations : enums, tables, index, triggers, fonctions, RLS, buckets Storage ; `seed.sql` ; génération des types | `npx supabase db push` passe ; tables visibles dans le dashboard Supabase |
| **2 — Authentification** | Inscriptions client et artisan, connexion, déconnexion, mot de passe oublié, `useAuth`, gardes de routes, page « en attente », gestion des comptes désactivés | Les 3 rôles se connectent et sont redirigés correctement |
| **3 — Espace artisan (boutique + produits)** | ART-1 à ART-5, upload d'images | Un artisan approuvé crée un produit avec images |
| **4 — Catalogue public** | Accueil dynamique, CAT-1 à CAT-9 | Recherche, filtres et pagination fonctionnent |
| **5 — Panier et commande** | PAN-1 à PAN-6, RPC `place_order` | Commande multi-artisans → N sous-commandes, stock décrémenté |
| **6 — Suivi des commandes** | CLI-2 à CLI-4, ART-6, ART-7, RPC `update_sub_order_status`, timeline | Le cycle de statuts complet et l'annulation (avec restauration du stock) fonctionnent |
| **7 — Favoris, avis, compte client** | CLI-1, CLI-5, CLI-6, ART-9 | Avis possible seulement après livraison |
| **8 — Administration** | ADM-1 à ADM-8 | Toutes les actions admin fonctionnent |
| **9 — Tableaux de bord, seed et finitions** | ART-8, stats admin, `seed-demo.ts`, polish UI, 404, revue de sécurité RLS, README final | Checklist de recette (§12) entièrement validée |

---

## 12. Recette finale (checklist)
- [ ] Un visiteur parcourt le catalogue, filtre, recherche et ajoute au panier sans compte.
- [ ] Inscription artisan → en attente → approuvé par l'admin → il publie un produit → le produit apparaît dans le catalogue.
- [ ] Un artisan refusé voit le motif, modifie sa boutique et resoumet.
- [ ] Un client commande des produits de 2 artisans → 2 sous-commandes, frais de livraison × 2, stock décrémenté.
- [ ] Commander plus que le stock → erreur claire, aucune donnée créée.
- [ ] L'artisan fait avancer la sous-commande jusqu'à `delivered` ; le client voit la timeline.
- [ ] Une annulation restaure le stock.
- [ ] Le client laisse un avis après livraison, et pas avant.
- [ ] L'admin masque un produit → il disparaît du catalogue. Il suspend un artisan → tous ses produits disparaissent.
- [ ] L'admin désactive un client → le client ne peut plus se connecter ni commander.
- [ ] Un client ne peut pas lire les commandes d'un autre (test via l'API avec sa session) ; un artisan ne peut pas modifier le produit d'un autre ; personne ne peut se donner le rôle admin.
- [ ] Tout est utilisable sur mobile (360 px).
- [ ] `npm run build` passe sans erreur TypeScript.

---

## 13. Hors périmètre (V2 possibles)
Paiement en ligne (Konnect / Flouci) · Commission · Variantes produit · Langue arabe (RTL) · Messagerie client–artisan · Notifications email ou SMS de changement de statut · Codes promo · Application mobile (React Native / Expo) · Suivi de livraison par un transporteur.
