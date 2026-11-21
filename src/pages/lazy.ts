import { lazy } from 'react'

// Pages chargées à la demande (React.lazy) — cahier des charges §8, performance.

// Public
export const HomePage = lazy(() => import('@/pages/public/HomePage'))
export const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'))
export const ComingSoonPage = lazy(() => import('@/pages/public/ComingSoonPage'))

// Catalogue
export const CatalogPage = lazy(() => import('@/pages/public/CatalogPage'))
export const ProductPage = lazy(() => import('@/pages/public/ProductPage'))
export const ArtisansPage = lazy(() => import('@/pages/public/ArtisansPage'))
export const ArtisanPublicPage = lazy(() => import('@/pages/public/ArtisanPublicPage'))

// Panier et commande
export const CartPage = lazy(() => import('@/pages/public/CartPage'))
export const CheckoutPage = lazy(() => import('@/pages/client/CheckoutPage'))
export const OrderConfirmationPage = lazy(() => import('@/pages/client/OrderConfirmationPage'))

// Authentification
export const LoginPage = lazy(() => import('@/pages/public/LoginPage'))
export const RegisterClientPage = lazy(() => import('@/pages/public/RegisterClientPage'))
export const RegisterArtisanPage = lazy(() => import('@/pages/public/RegisterArtisanPage'))
export const ForgotPasswordPage = lazy(() => import('@/pages/public/ForgotPasswordPage'))
export const ResetPasswordPage = lazy(() => import('@/pages/public/ResetPasswordPage'))

// Artisan
export const ArtisanPendingPage = lazy(() => import('@/pages/artisan/ArtisanPendingPage'))
export const ArtisanShopPage = lazy(() => import('@/pages/artisan/ArtisanShopPage'))
export const ArtisanProductsPage = lazy(() => import('@/pages/artisan/ArtisanProductsPage'))
export const ArtisanProductFormPage = lazy(() => import('@/pages/artisan/ArtisanProductFormPage'))
