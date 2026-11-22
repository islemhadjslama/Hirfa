# Installer Hirfa sur un autre ordinateur

Ce guide part de zéro : de GitHub jusqu'au site ouvert dans le navigateur.
Compter environ **10 minutes** (option A) ou **20 minutes** (option B).

---

## 1. Installer les outils (une seule fois)

| Outil | Version | Lien |
|---|---|---|
| **Node.js** | 22 LTS ou plus récent (inclut `npm`) | https://nodejs.org |
| **Git** | n'importe laquelle | https://git-scm.com |
| VS Code (conseillé) | — | https://code.visualstudio.com |

Vérifier dans un terminal :

```bash
node -v    # doit afficher v22.x ou plus
npm -v
git --version
```

> Sous Windows, après l'installation de Node, **fermer et rouvrir** le terminal pour que la commande `node` soit reconnue.

---

## 2. Télécharger le projet depuis GitHub

**Avec Git** (recommandé) :

```bash
git clone https://github.com/islemhadjslama/Hirfa.git
cd Hirfa
```

**Sans Git** : sur la page GitHub du projet → bouton vert **Code** → **Download ZIP**, extraire le dossier, puis ouvrir un terminal dans ce dossier.

> Si le dépôt est **privé**, le propriétaire doit d'abord vous ajouter comme collaborateur (GitHub → *Settings* → *Collaborators*).

---

## 3. Installer les dépendances

```bash
npm install
```

Cela crée le dossier `node_modules` (environ 1 Go, quelques minutes la première fois).

---

## 4. Configurer Supabase

Le site a besoin d'une base Supabase. Deux possibilités :

### Option A — Utiliser la base existante (la plus simple)

Le propriétaire du projet vous transmet **deux valeurs** (Supabase → *Project Settings* → *API Keys*) :

- l'URL du projet (`https://xxxx.supabase.co`)
- la clé **publishable** (ou *anon*)

Créer le fichier `.env.local` à la racine du projet en copiant `.env.example` :

```bash
# Windows (PowerShell)
Copy-Item .env.example .env.local
# macOS / Linux
cp .env.example .env.local
```

Puis le remplir :

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=
```

Laisser `SUPABASE_SECRET_KEY` **vide** : elle n'est pas nécessaire pour utiliser le site.
Les données de démonstration existent déjà dans cette base → passer directement à l'**étape 5**.

> ⚠️ Ne jamais partager ni committer la clé **secret** (`sb_secret_...`). Le fichier `.env.local` est ignoré par Git.

### Option B — Créer sa propre base Supabase

1. Créer un compte et un **nouveau projet** sur https://supabase.com (noter le mot de passe de la base).
2. Dans le dashboard : **Authentication** → **Sign In / Providers** → **Email** → désactiver **Confirm email**, puis enregistrer.
3. Créer `.env.local` (voir option A) avec les **trois** valeurs de *Project Settings* → *API Keys* : URL, clé publishable **et** clé secret.
4. Relier le projet local à votre projet Supabase :

   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-du-projet>
   ```

   Le *ref* est la partie `xxxx` de `https://xxxx.supabase.co`. Le mot de passe de la base est demandé.

5. Créer les tables, les règles de sécurité et les buckets de stockage :

   ```bash
   npm run db:push
   ```

   Répondre `Y` à la confirmation.

6. Remplir la base avec les données de démonstration (comptes, 30 produits avec images, commandes, avis) :

   ```bash
   npm run seed
   ```

   Le script se termine par `✔ Terminé.` Il peut être relancé sans créer de doublons.

---

## 5. Lancer le site

```bash
npm run dev
```

Ouvrir l'adresse affichée, en général **http://localhost:5173**.

> Si le port 5173 est déjà pris, Vite utilise 5174, 5175… : prendre l'adresse indiquée dans le terminal.
> Pour arrêter le serveur : `Ctrl + C` dans le terminal.

---

## 6. Tester le site

### Comptes de démonstration

Mot de passe commun : **`Hirfa2026!`**

| Rôle | Email | Ce qu'on peut tester |
|---|---|---|
| Administrateur | `admin@hirfa.tn` | `/admin` : statistiques, validation des artisans, modération des produits et des avis, comptes |
| Artisan | `artisan1@hirfa.tn` … `artisan4@hirfa.tn` | `/artisan` : tableau de bord, produits, commandes reçues, boutique |
| Artisan en attente | `artisan5@hirfa.tn` | Page « en attente de validation » |
| Client | `client1@hirfa.tn` … `client3@hirfa.tn` | Panier, commande, suivi, favoris, avis |

### Parcours conseillé (15 minutes)

1. **Visiteur** (sans se connecter) : parcourir `/catalogue`, rechercher « ceramique », filtrer par catégorie et prix, ouvrir une fiche, ajouter 2 produits au panier.
2. **Client** (`client1`) : commander des produits de **deux artisans différents** → la confirmation affiche 2 colis et 2 frais de livraison. Voir la commande dans **Mon compte → Commandes**.
3. **Artisan** (`artisan1`) : dans **Commandes**, faire avancer la commande : Confirmer → En préparation → Expédiée → Livrée.
4. **Client** : la frise de suivi montre chaque étape ; une fois livrée, laisser un **avis** sur le produit.
5. **Admin** : valider ou refuser `artisan5`, masquer un produit (il disparaît du catalogue), désactiver un client.
6. **Mobile** : dans le navigateur, `F12` → icône téléphone → largeur **360 px**.

La checklist complète, point par point, est dans [RECETTE.md](RECETTE.md).

### Vérifications techniques (facultatif)

```bash
npm run build     # compilation TypeScript + build de production
npm run lint      # qualité du code
npm run db:test   # 147 tests de la base (RLS, commandes, stock…), sans toucher à Supabase
```

---

## Problèmes fréquents

| Symptôme | Solution |
|---|---|
| `'node' n'est pas reconnu…` | Node n'est pas installé, ou le terminal n'a pas été rouvert après l'installation. |
| Page blanche, ou erreur « Configuration Supabase manquante » | `.env.local` absent, mal nommé (pas `.env.local.txt`) ou incomplet. Relancer `npm run dev` après l'avoir modifié. |
| « Identifiants invalides » avec un compte de démo | La base ne contient pas encore les comptes : lancer `npm run seed` (option B). |
| « Email not confirmed » à l'inscription | Désactiver **Confirm email** dans Supabase (option B, étape 2). |
| Catalogue vide | Base vide (`npm run seed`) ou mauvaise URL Supabase dans `.env.local`. |
| `npm run seed` : « Variables manquantes… » | Renseigner les trois valeurs, dont la clé **secret**, dans `.env.local`. |
| `npm install` échoue avec `ENOSPC` | Disque plein : libérer de l'espace (ex. `npm cache clean --force`). |
