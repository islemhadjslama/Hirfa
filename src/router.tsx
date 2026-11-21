import { createBrowserRouter, type RouteObject } from 'react-router'

import { GuestOnlyRoute } from '@/components/auth/GuestOnlyRoute'
import { RequireRole } from '@/components/auth/RequireRole'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ArtisanLayout } from '@/components/layout/ArtisanLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { RootLayout } from '@/components/layout/RootLayout'
import {
  ArtisanPendingPage,
  ArtisanProductFormPage,
  ArtisanProductsPage,
  ArtisanShopPage,
  ComingSoonPage,
  ForgotPasswordPage,
  HomePage,
  LoginPage,
  NotFoundPage,
  RegisterArtisanPage,
  RegisterClientPage,
  ResetPasswordPage,
} from '@/pages/lazy'

/** Route provisoire : sera remplacée par la vraie page dans la phase concernée. */
function soon(path: string, title: string): RouteObject {
  return { path, element: <ComingSoonPage title={title} /> }
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // ---------------------------------------------------------------- Public
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
          soon('catalogue', 'Catalogue'),
          soon('produits/:slug', 'Produit'),
          soon('artisans', 'Nos artisans'),
          soon('artisans/:slug', 'Boutique'),
          soon('panier', 'Mon panier'),

          // Visiteurs uniquement (un utilisateur connecté est redirigé vers son espace)
          {
            element: <GuestOnlyRoute />,
            children: [
              { path: 'connexion', element: <LoginPage /> },
              { path: 'inscription', element: <RegisterClientPage /> },
              { path: 'artisan/inscription', element: <RegisterArtisanPage /> },
              { path: 'mot-de-passe-oublie', element: <ForgotPasswordPage /> },
            ],
          },
          { path: 'reinitialiser-mot-de-passe', element: <ResetPasswordPage /> },

          // -------------------------------------------------------- Client
          {
            element: <RequireRole roles={['client']} />,
            children: [
              soon('commande', 'Commande'),
              soon('commande/confirmation/:id', 'Confirmation de commande'),
              soon('compte', 'Mon compte'),
              soon('compte/commandes', 'Mes commandes'),
              soon('compte/commandes/:id', 'Détail de la commande'),
              soon('compte/favoris', 'Mes favoris'),
            ],
          },

          { path: '*', element: <NotFoundPage /> },
        ],
      },

      // --------------------------------------------------------------- Artisan
      {
        path: 'artisan',
        element: <RequireRole roles={['artisan']} />,
        children: [
          {
            element: <ArtisanLayout />,
            children: [
              // Accessibles même si la boutique n'est pas approuvée (ART-1)
              { path: 'en-attente', element: <ArtisanPendingPage /> },
              { path: 'boutique', element: <ArtisanShopPage /> },

              // Boutique approuvée uniquement
              {
                element: <RequireRole roles={['artisan']} requireApproved />,
                children: [
                  { index: true, element: <ComingSoonPage title="Tableau de bord" /> },
                  { path: 'produits', element: <ArtisanProductsPage /> },
                  { path: 'produits/nouveau', element: <ArtisanProductFormPage /> },
                  { path: 'produits/:id/modifier', element: <ArtisanProductFormPage /> },
                  soon('commandes', 'Commandes'),
                  soon('commandes/:id', 'Détail de la commande'),
                  soon('avis', 'Avis reçus'),
                ],
              },
            ],
          },
        ],
      },

      // ----------------------------------------------------------------- Admin
      {
        path: 'admin',
        element: <RequireRole roles={['admin']} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <ComingSoonPage title="Tableau de bord" /> },
              soon('artisans', 'Artisans'),
              soon('artisans/:id', 'Détail de l’artisan'),
              soon('clients', 'Clients'),
              soon('clients/:id', 'Détail du client'),
              soon('produits', 'Produits'),
              soon('categories', 'Catégories'),
              soon('commandes', 'Commandes'),
              soon('commandes/:id', 'Détail de la commande'),
              soon('avis', 'Avis'),
              soon('parametres', 'Paramètres'),
            ],
          },
        ],
      },
    ],
  },
])
