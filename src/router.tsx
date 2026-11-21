import { createBrowserRouter } from 'react-router'

import { GuestOnlyRoute } from '@/components/auth/GuestOnlyRoute'
import { RequireRole } from '@/components/auth/RequireRole'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ArtisanLayout } from '@/components/layout/ArtisanLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { RootLayout } from '@/components/layout/RootLayout'
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
  ComingSoonPage,
  ForgotPasswordPage,
  HomePage,
  LoginPage,
  NotFoundPage,
  OrderConfirmationPage,
  RegisterArtisanPage,
  RegisterClientPage,
  ResetPasswordPage,
} from '@/pages/lazy'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // ---------------------------------------------------------------- Public
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'catalogue', element: <CatalogPage /> },
          { path: 'produits/:slug', element: <ProductPage /> },
          { path: 'artisans', element: <ArtisansPage /> },
          { path: 'artisans/:slug', element: <ArtisanPublicPage /> },
          { path: 'panier', element: <CartPage /> },

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
              { path: 'commande', element: <CheckoutPage /> },
              { path: 'commande/confirmation/:id', element: <OrderConfirmationPage /> },
              { path: 'compte', element: <AccountPage /> },
              { path: 'compte/commandes', element: <ClientOrdersPage /> },
              { path: 'compte/commandes/:id', element: <ClientOrderDetailPage /> },
              { path: 'compte/favoris', element: <FavoritesPage /> },
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
                  // ART-8 (tableau de bord artisan) : Phase 9
                  { index: true, element: <ComingSoonPage title="Tableau de bord" /> },
                  { path: 'produits', element: <ArtisanProductsPage /> },
                  { path: 'produits/nouveau', element: <ArtisanProductFormPage /> },
                  { path: 'produits/:id/modifier', element: <ArtisanProductFormPage /> },
                  { path: 'commandes', element: <ArtisanOrdersPage /> },
                  { path: 'commandes/:id', element: <ArtisanOrderDetailPage /> },
                  { path: 'avis', element: <ArtisanReviewsPage /> },
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
              { index: true, element: <AdminDashboardPage /> },
              { path: 'artisans', element: <AdminArtisansPage /> },
              { path: 'artisans/:id', element: <AdminArtisanDetailPage /> },
              { path: 'clients', element: <AdminClientsPage /> },
              { path: 'clients/:id', element: <AdminClientDetailPage /> },
              { path: 'produits', element: <AdminProductsPage /> },
              { path: 'categories', element: <AdminCategoriesPage /> },
              { path: 'commandes', element: <AdminOrdersPage /> },
              { path: 'commandes/:id', element: <AdminOrderDetailPage /> },
              { path: 'avis', element: <AdminReviewsPage /> },
              { path: 'parametres', element: <AdminSettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
])
