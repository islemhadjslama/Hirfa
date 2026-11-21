# Guide pas à pas — Développer Hirfa avec Claude Code

## Étape 1 — Installer les outils (une seule fois)

| Outil | Lien / commande | Vérification |
|---|---|---|
| **Node.js 20 LTS ou plus** | https://nodejs.org | `node -v` |
| **Git** (sur Windows : Git for Windows) | https://git-scm.com/downloads | `git --version` |
| **VS Code** | https://code.visualstudio.com | — |
| **Claude Code** | voir ci-dessous | `claude --version` |

**Installer Claude Code** (méthode officielle recommandée) :
- **Windows (PowerShell)** :
  ```powershell
  irm https://claude.ai/install.ps1 | iex
  ```
- **macOS / Linux / WSL** :
  ```bash
  curl -fsSL https://claude.ai/install.sh | bash
  ```

Ouvre ensuite un **nouveau** terminal et tape `claude --version`. Il faut un abonnement Claude (Pro ou Max) ou un compte Anthropic Console. La connexion est demandée au premier lancement.
> Sur Windows, installe **Git for Windows** avant : Claude Code l'utilise comme terminal.

---

## Étape 2 — Créer le projet Supabase (5 min)
1. Crée un compte sur https://supabase.com, puis **New project**.
   - Nom : `hirfa`.
   - **Database password** : note-le bien, il sera demandé plus tard.
   - Région : **Central EU (Frankfurt)**, la plus proche de la Tunisie.
2. Une fois le projet prêt, va dans **Project Settings → API Keys** et note :
   - **Project URL**, au format `https://xxxx.supabase.co` ;
   - la clé **Publishable** (ou **anon** dans l'onglet « Legacy ») ;
   - la clé **Secret** (ou **service_role** dans « Legacy »). ⚠️ Ne la partage jamais.
3. Note aussi le **Project ref** : c'est le `xxxx` de l'URL.
4. Va dans **Authentication → Sign In / Providers → Email** et **désactive « Confirm email »**. C'est plus simple en développement, et le plan gratuit limite fortement l'envoi d'emails.
5. Va dans **Authentication → URL Configuration** :
   - Site URL : `http://localhost:5173` ;
   - Redirect URLs : ajoute `http://localhost:5173/**`.

---

## Étape 3 — Préparer le dossier
```bash
mkdir hirfa
cd hirfa
git init
```
Copie dans ce dossier les fichiers **`CLAUDE.md`** et **`CAHIER_DES_CHARGES.md`**.

Ouvre le dossier dans VS Code (`code .`), puis lance Claude Code dans le terminal :
```bash
claude
```

---

## Étape 4 — Faire développer le projet, phase par phase
Copie-colle les prompts ci-dessous **un par un**. Après chaque phase : teste, puis fais un commit (`git add . && git commit -m "Phase X"`), et seulement ensuite passe à la suivante.

> 💡 Astuce : pour les phases 1, 5 et 6 (les plus délicates), appuie sur **Shift+Tab** pour passer en **mode Plan**. Claude Code propose alors un plan avant de coder, et tu le valides.

**Phase 0**
```
Lis CLAUDE.md et CAHIER_DES_CHARGES.md en entier. Réalise uniquement la Phase 0.
```
Ensuite : crée `.env.local` en copiant `.env.example`, remplis les 3 clés de l'étape 2, lance `npm run dev` et ouvre http://localhost:5173.

**Phase 1**
```
Réalise la Phase 1 (base de données) selon les sections 5 et 6 du cahier des charges.
```
Ensuite, dans un terminal **séparé** (pas dans Claude Code), lance :
```bash
npx supabase login
npx supabase link --project-ref TON_PROJECT_REF
npm run db:push            # demande le mot de passe de la base
npm run db:types
```
Pour vérifier : dans Supabase, ouvre **Table Editor** ; les tables doivent apparaître, avec les catégories remplies.

**Créer ton compte admin** (après la Phase 2) : inscris-toi normalement sur le site, puis dans Supabase, ouvre **SQL Editor** et exécute :
```sql
update profiles set role = 'admin' where email = 'ton.email@exemple.com';
```
(À partir de la Phase 9, `npm run seed` crée aussi `admin@hirfa.tn` / `Hirfa2026!`.)

**Phases 2 à 9** : un prompt par phase.
```
Phase 1 validée. Réalise la Phase 2.
```
Remplace le numéro à chaque fois. À la fin de la Phase 9, lance :
```bash
npm run seed
```

**Si quelque chose ne marche pas**, copie l'erreur exacte dans Claude Code :
```
J'ai cette erreur en testant [ce que tu faisais] : <colle l'erreur>. Corrige-la.
```

---

## Étape 5 — Dépannage rapide
| Erreur | Cause probable | Solution |
|---|---|---|
| `Invalid API key` | Mauvaise clé dans `.env.local` | Vérifie les clés et **redémarre** `npm run dev` |
| `new row violates row-level security policy` | Politique RLS trop stricte ou mauvais rôle | Donne l'erreur et l'action effectuée à Claude Code |
| `email rate limit exceeded` | « Confirm email » encore activé | Étape 2, point 4 |
| Les tables n'apparaissent pas | Migration non poussée | `npm run db:push` |
| Erreurs TypeScript après une migration | Types non régénérés | `npm run db:types` |
| `claude` n'est pas reconnu | PATH non mis à jour | Ferme et rouvre le terminal |

---

## Étape 6 (optionnelle) — Mise en ligne gratuite sur Vercel
1. Pousse le projet sur GitHub.
2. Sur https://vercel.com, clique **Import Project**, puis ajoute `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` dans les variables d'environnement. **Pas la clé secrète.**
3. Demande à Claude Code d'ajouter un `vercel.json` avec un rewrite SPA vers `/index.html`.
4. Dans Supabase, ajoute l'URL Vercel dans **Site URL** et dans **Redirect URLs**.
