# Recette — Hirfa

Checklist de recette du cahier des charges (§12), avec pour chaque point **ce qui est vérifié automatiquement** et **comment le vérifier à la main** avec les comptes de démonstration (`npm run seed`, mot de passe `Hirfa2026!`).

Légende : ✅ couvert par les tests automatiques · 🖐 à valider à la main sur la vraie base.

- **Tests de la base** : `npm run db:test` — 147 scénarios (migrations, RLS, RPC, triggers, Storage) exécutés dans PGlite.
- **Tests navigateur** : Chrome headless, réalisés à chaque phase (pages, formulaires, requêtes envoyées à Supabase, 360 px). Supabase y est simulé : aucune donnée réelle n'a été écrite.

## Checklist §12

| # | Point de recette | Automatique | Vérification manuelle |
|---|---|---|---|
| 1 | Un visiteur parcourt le catalogue, filtre, recherche et ajoute au panier sans compte. | ✅ vue `catalog_products` (RM-1), recherche sans accents ; navigateur : filtres, tri, pagination, panier persistant | 🖐 Déconnecté : `/catalogue`, chercher « ceramique », filtrer « Bijoux » + prix max 100, ajouter 2 produits ; le badge du panier affiche 2. |
| 2 | Inscription artisan → en attente → approuvé par l'admin → il publie un produit → le produit apparaît dans le catalogue. | ✅ trigger d'inscription (pending), refus de création avant approbation, création après, visibilité publique | 🖐 S'inscrire sur `/artisan/inscription` ; avec `admin@hirfa.tn`, l'approuver depuis `/admin` ; reconnecté en artisan, créer un produit publié avec une image ; il apparaît dans `/catalogue`. |
| 3 | Un artisan refusé voit le motif, modifie sa boutique et resoumet. | ✅ motif obligatoire, `rejected → pending` autorisé à l'artisan seul ; navigateur : page « en attente », « Enregistrer et resoumettre » | 🖐 Admin : refuser `artisan5@hirfa.tn` avec un motif ; artisan5 voit le motif sur `/artisan/en-attente`, modifie sa boutique et resoumet ; il réapparaît « En attente » côté admin. |
| 4 | Un client commande des produits de 2 artisans → 2 sous-commandes, frais de livraison × 2, stock décrémenté. | ✅ `place_order` (2 sous-commandes, frais × 2, totaux, stock, numéro `HRF-AAAAMMJJ-00001`) ; navigateur : panier groupé, checkout, confirmation | 🖐 `client1` : panier avec un produit de Dar El Fekhar et un de Fidha Djerba ; commander ; la confirmation affiche 2 colis et 2 × 7,000 DT ; le stock a baissé (fiche produit). |
| 5 | Commander plus que le stock → erreur claire, aucune donnée créée. | ✅ « Stock insuffisant pour « … » », aucune commande créée, stock intact ; navigateur : message + panier conservé | 🖐 Deux navigateurs, deux clients, le même produit au stock de 1 (ex. « Collier de corail » : 2) : la seconde commande affiche l'erreur nommant le produit. |
| 6 | L'artisan fait avancer la sous-commande jusqu'à `delivered` ; le client voit la timeline. | ✅ cycle complet, pas de saut d'étape, `delivered` final, historique lisible par le client | 🖐 `artisan1` : `/artisan/commandes` → « Confirmer » → … → « Marquer comme livrée » ; `client2` voit chaque étape dans `/compte/commandes`. |
| 7 | Une annulation restaure le stock. | ✅ annulation artisan (motif obligatoire), client (`pending`), admin ; stock restauré | 🖐 Noter le stock d'un produit, commander, annuler (client ou artisan) : le stock revient à sa valeur. |
| 8 | Le client laisse un avis après livraison, et pas avant. | ✅ RLS : refus avant livraison, un seul avis par produit, `can_review_product` | 🖐 `client1` : avis possible sur « Plat à couscous décoré » (livré), message « après l'avoir reçu » sur un produit non livré. |
| 9 | L'admin masque un produit → il disparaît du catalogue. Il suspend un artisan → tous ses produits disparaissent. | ✅ masquage et suspension retirent les produits de la vue, réactivation les rétablit | 🖐 `/admin/produits` → « Masquer » ; `/admin/artisans` → « Suspendre » Fidha Djerba : ses produits quittent `/catalogue` et l'accueil. |
| 10 | L'admin désactive un client → le client ne peut plus se connecter ni commander. | ✅ `place_order` refuse un compte désactivé ; navigateur : déconnexion avec message (AUTH-6) | 🖐 Désactiver `client3` ; connecté ailleurs, il est déconnecté (au plus tard 60 s ou au retour sur l'onglet) avec « Votre compte a été désactivé… » ; une nouvelle connexion est refusée de la même façon. |
| 11 | Un client ne peut pas lire les commandes d'un autre ; un artisan ne peut pas modifier le produit d'un autre ; personne ne peut se donner le rôle admin. | ✅ isolement des commandes, produits, profils, Storage ; rôle `admin` impossible (inscription et `UPDATE`) | 🖐 Voir « Test via l'API » ci-dessous. |
| 12 | Tout est utilisable sur mobile (360 px). | ✅ navigateur : aucune page en défilement horizontal à 360 px (public, client, artisan, admin) | 🖐 DevTools en mode mobile 360 px : menu ☰, filtres du catalogue en tiroir, tableaux défilants. |
| 13 | `npm run build` passe sans erreur TypeScript. | ✅ build + lint + Prettier à chaque phase | 🖐 `npm run build`. |

### Test via l'API (point 11)

Dans la console du navigateur, connecté en `client1@hirfa.tn` sur l'application :

```js
const { supabase } = await import('/src/lib/supabase.ts')
// Commandes visibles : uniquement les siennes
await supabase.from('orders').select('order_number, client_id')
// Tenter de devenir admin → erreur « Vous ne pouvez pas modifier votre rôle. »
const { data: { user } } = await supabase.auth.getUser()
await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)
// Écrire une commande directement → refusé (aucun droit d'écriture)
await supabase.from('orders').insert({})
```

Connecté en `artisan1@hirfa.tn` : `await supabase.from('products').update({ price: 1 }).eq('artisan_id', '<id d’artisan2>')` ne modifie **aucune** ligne.

## Revue de sécurité

Revue de toutes les politiques RLS, fonctions et politiques Storage (Phase 9), avec un test automatique pour chaque règle.

| Élément | Constat | Statut |
|---|---|---|
| RLS | Activée sur les 12 tables ; aucune politique d'écriture sur `orders`, `sub_orders`, `order_items`, `sub_order_status_history`. | ✅ |
| Droits (`GRANT`) | `anon` : lecture du catalogue uniquement ; `authenticated` : écriture seulement là où une politique existe. | ✅ |
| Fonctions sensibles | `SECURITY DEFINER` + `SET search_path = public` ; `EXECUTE` retiré à `anon` pour les RPC de commande et les statistiques. | ✅ |
| Colonnes privilégiées (RM-9) | Triggers sur `profiles`, `artisan_profiles`, `products`, `reviews` ; contournables seulement par l'admin, la clé secrète et le SQL Editor. | ✅ |
| Rôle admin | Impossible par l'inscription (métadonnées ignorées) et par `UPDATE`. | ✅ |
| Images de produit | **Corrigé** : un artisan pouvait référencer le fichier d'un autre artisan. Le chemin doit maintenant être `{uid}/{product_id}/…` (migration `security_hardening`). | ✅ corrigé |
| Storage (listing) | **Corrigé** : la politique de lecture permettait de lister tous les fichiers. Le listing est limité à son dossier (ou à l'admin) ; les URL publiques restent accessibles. | ✅ corrigé |
| Données personnelles | `profiles` privée ; avis publics avec nom abrégé, sans id ni email ; l'artisan ne voit que les coordonnées de livraison de ses commandes. | ✅ |
| Clé secrète | Absente de `src/` et du build ; utilisée uniquement par `scripts/seed-demo.ts`. | ✅ |

### Points d'attention avant une vraie mise en production (hors périmètre académique)

- **Réactiver « Confirm email »** et configurer un SMTP (désactivé pour le développement).
- Activer la **protection contre les mots de passe compromis** et vérifier le *Security Advisor* du dashboard Supabase.
- `increment_product_view` n'est pas limité en fréquence : un visiteur peut gonfler le compteur de vues (sans impact sur les commandes).
- Les URL de logo et de bannière ne sont pas restreintes au domaine Supabase (elles ne sont jamais rendues comme HTML, uniquement en `src` d'image).
- Pas de limitation de débit applicative (au-delà de celle de Supabase Auth).
