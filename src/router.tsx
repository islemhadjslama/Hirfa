import { createBrowserRouter, type RouteObject } from 'react-router'

import { GuestOnlyRoute } from '@/components/auth/GuestOnlyRoute'
import { RequireRole } from '@/components/auth/RequireRole'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ArtisanLayout } from '@/components/layout/ArtisanLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { RootLayout } from '@/components/layout/RootLayout'
import { RouteErrorPage } from '@/components/layout/RouteErrorPage'
import {
  AccountPage,
  AdminArtisanDetailPage,
  AdminArtisansPage,
  AdminCategoriesPage,
  AdminClientDetailPage,
  AdminClientsPage,
  AdminDashboardPage,
  AdminOrderDetailPage,
  AdminOrdersPage,
  AdminProductsPage,
  AdminReviewsPage,
  AdminSettingsPage,
  ArtisanDashboardPage,
  ArtisanOrderDetailPage,
  ArtisanOrdersPage,
  ArtisanPendingPage,
  ArtisanPublicPage,
  ArtisanReviewsPage,
  ArtisansPage,
  CartPage,
  CatalogPage,
  CheckoutPage,
  ClientOrderDetailPage,
  ClientOrdersPage,
  FavoritesPage,
  ProductPage,
  ArtisanProductFormPage,
  ArtisanProductsPage,
  ArtisanShopPage,
  ForgotPasswordPage,
  HomePage,
  LoginPage,
  NotFoundPage,
  OrderConfirmationPage,
  RegisterArtisanPage,
  RegisterClientPage,
  ResetPasswordPage,
} from '@/pages/lazy'

/** Titre de l'onglet, lu par RootLayout (`null` : la page le définit elle-même). */
export type RouteHandle = { title: string | null }

/** Route feuille avec son titre d'onglet. */
function page(
  path: string | null,
  element: RouteObject['element'],
  title: string | null,
): RouteObject {
  const handle: RouteHandle = { title }
  return path === null ? { index: true, element, handle } : { path, element, handle }
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      // ---------------------------------------------------------------- Public
      {
        element: <PublicLayout />,
        children: [
          page(null, <HomePage />, ''),
          page('catalogue', <CatalogPage />, 'Catalogue'),
          page('produits/:slug', <ProductPage />, null),
          page('artisans', <ArtisansPage />, 'Nos artisans'),
          page('artisans/:slug', <ArtisanPublicPage />, null),
          page('panier', <CartPage />, 'Mon panier'),

          // Visiteurs uniquement (un utilisateur connecté est redirigé vers son espace)
          {
            element: <GuestOnlyRoute />,
            children: [
              page('connexion', <LoginPage />, 'Connexion'),
              page('inscription', <RegisterClientPage />, 'Créer un compte'),
              page('artisan/inscription', <RegisterArtisanPage />, 'Ouvrir ma boutique'),
              page('mot-de-passe-oublie', <ForgotPasswordPage />, 'Mot de passe oublié'),
            ],
          },
          page('reinitialiser-mot-de-passe', <ResetPasswordPage />, 'Nouveau mot de passe'),

          // -------------------------------------------------------- Client
          {
            element: <RequireRole roles={['client']} />,
            children: [
              page('commande', <CheckoutPage />, 'Finaliser ma commande'),
              page('commande/confirmation/:id', <OrderConfirmationPage />, 'Commande confirmée'),
              page('compte', <AccountPage />, 'Mon compte'),
              page('compte/commandes', <ClientOrdersPage />, 'Mes commandes'),
              page('compte/commandes/:id', <ClientOrderDetailPage />, 'Détail de la commande'),
              page('compte/favoris', <FavoritesPage />, 'Mes favoris'),
            ],
          },

          page('*', <NotFoundPage />, 'Page introuvable'),
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
              page('en-attente', <ArtisanPendingPage />, 'Statut de ma boutique'),
              page('boutique', <ArtisanShopPage />, 'Ma boutique'),

              // Boutique approuvée uniquement
              {
                element: <RequireRole roles={['artisan']} requireApproved />,
                children: [
                  page(null, <ArtisanDashboardPage />, 'Tableau de bord'),
                  page('produits', <ArtisanProductsPage />, 'Mes produits'),
                  page('produits/nouveau', <ArtisanProductFormPage />, 'Nouveau produit'),
                  page('produits/:id/modifier', <ArtisanProductFormPage />, 'Modifier le produit'),
                  page('commandes', <ArtisanOrdersPage />, 'Commandes'),
                  page('commandes/:id', <ArtisanOrderDetailPage />, 'Détail de la commande'),
                  page('avis', <ArtisanReviewsPage />, 'Avis reçus'),
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
              page(null, <AdminDashboardPage />, 'Administration'),
              page('artisans', <AdminArtisansPage />, 'Artisans · Admin'),
              page('artisans/:id', <AdminArtisanDetailPage />, 'Artisan · Admin'),
              page('clients', <AdminClientsPage />, 'Clients · Admin'),
              page('clients/:id', <AdminClientDetailPage />, 'Client · Admin'),
              page('produits', <AdminProductsPage />, 'Produits · Admin'),
              page('categories', <AdminCategoriesPage />, 'Catégories · Admin'),
              page('commandes', <AdminOrdersPage />, 'Commandes · Admin'),
              page('commandes/:id', <AdminOrderDetailPage />, 'Commande · Admin'),
              page('avis', <AdminReviewsPage />, 'Avis · Admin'),
              page('parametres', <AdminSettingsPage />, 'Paramètres · Admin'),
            ],
          },
        ],
      },
    ],
  },
])
