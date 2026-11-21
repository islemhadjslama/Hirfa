import { lazy } from 'react'

// Pages chargées à la demande (React.lazy) — cahier des charges §8, performance.

// Public
export const HomePage = lazy(() => import('@/pages/public/HomePage'))
export const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'))

// Catalogue
export const CatalogPage = lazy(() => import('@/pages/public/CatalogPage'))
export const ProductPage = lazy(() => import('@/pages/public/ProductPage'))
export const ArtisansPage = lazy(() => import('@/pages/public/ArtisansPage'))
export const ArtisanPublicPage = lazy(() => import('@/pages/public/ArtisanPublicPage'))

// Panier et commande
export const CartPage = lazy(() => import('@/pages/public/CartPage'))
export const CheckoutPage = lazy(() => import('@/pages/client/CheckoutPage'))
export const OrderConfirmationPage = lazy(() => import('@/pages/client/OrderConfirmationPage'))
export const ClientOrdersPage = lazy(() => import('@/pages/client/ClientOrdersPage'))
export const ClientOrderDetailPage = lazy(() => import('@/pages/client/ClientOrderDetailPage'))
export const AccountPage = lazy(() => import('@/pages/client/AccountPage'))
export const FavoritesPage = lazy(() => import('@/pages/client/FavoritesPage'))

// Authentification
export const LoginPage = lazy(() => import('@/pages/public/LoginPage'))
export const RegisterClientPage = lazy(() => import('@/pages/public/RegisterClientPage'))
export const RegisterArtisanPage = lazy(() => import('@/pages/public/RegisterArtisanPage'))
export const ForgotPasswordPage = lazy(() => import('@/pages/public/ForgotPasswordPage'))
export const ResetPasswordPage = lazy(() => import('@/pages/public/ResetPasswordPage'))

// Artisan
export const ArtisanPendingPage = lazy(() => import('@/pages/artisan/ArtisanPendingPage'))
export const ArtisanDashboardPage = lazy(() => import('@/pages/artisan/ArtisanDashboardPage'))
export const ArtisanShopPage = lazy(() => import('@/pages/artisan/ArtisanShopPage'))
export const ArtisanProductsPage = lazy(() => import('@/pages/artisan/ArtisanProductsPage'))
export const ArtisanProductFormPage = lazy(() => import('@/pages/artisan/ArtisanProductFormPage'))
export const ArtisanOrdersPage = lazy(() => import('@/pages/artisan/ArtisanOrdersPage'))
export const ArtisanOrderDetailPage = lazy(() => import('@/pages/artisan/ArtisanOrderDetailPage'))
export const ArtisanReviewsPage = lazy(() => import('@/pages/artisan/ArtisanReviewsPage'))

// Administration
export const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
export const AdminArtisansPage = lazy(() => import('@/pages/admin/AdminArtisansPage'))
export const AdminArtisanDetailPage = lazy(() => import('@/pages/admin/AdminArtisanDetailPage'))
export const AdminClientsPage = lazy(() => import('@/pages/admin/AdminClientsPage'))
export const AdminClientDetailPage = lazy(() => import('@/pages/admin/AdminClientDetailPage'))
export const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'))
export const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage'))
export const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'))
export const AdminOrderDetailPage = lazy(() => import('@/pages/admin/AdminOrderDetailPage'))
export const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage'))
export const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'))
