import { createBrowserRouter, type RouteObject } from 'react-router'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { ArtisanLayout } from '@/components/layout/ArtisanLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { ComingSoonPage, HomePage, NotFoundPage } from '@/pages/lazy'

/** Route provisoire : sera remplacée par la vraie page dans la phase concernée. */
function soon(path: string, title: string): RouteObject {
  return { path, element: <ComingSoonPage title={title} /> }
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      soon('catalogue', 'Catalogue'),
      soon('produits/:slug', 'Produit'),
      soon('artisans', 'Nos artisans'),
      soon('artisans/:slug', 'Boutique'),
      soon('panier', 'Mon panier'),
      soon('connexion', 'Connexion'),
      soon('inscription', 'Créer un compte'),
      soon('artisan/inscription', 'Devenir artisan'),
      soon('mot-de-passe-oublie', 'Mot de passe oublié'),
      soon('reinitialiser-mot-de-passe', 'Réinitialiser le mot de passe'),
      soon('artisan/en-attente', 'Compte en attente'),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'artisan',
    element: <ArtisanLayout />,
    children: [
      { index: true, element: <ComingSoonPage title="Tableau de bord" /> },
      soon('boutique', 'Ma boutique'),
      soon('produits', 'Mes produits'),
      soon('commandes', 'Commandes'),
      soon('avis', 'Avis reçus'),
    ],
  },
  {
    path: 'admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <ComingSoonPage title="Tableau de bord" /> },
      soon('artisans', 'Artisans'),
      soon('clients', 'Clients'),
      soon('produits', 'Produits'),
      soon('categories', 'Catégories'),
      soon('commandes', 'Commandes'),
      soon('avis', 'Avis'),
      soon('parametres', 'Paramètres'),
    ],
  },
])
