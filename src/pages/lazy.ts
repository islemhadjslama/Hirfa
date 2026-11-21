import { lazy } from 'react'

// Pages chargées à la demande (React.lazy) — cahier des charges §8, performance.

// Public
export const HomePage = lazy(() => import('@/pages/public/HomePage'))
export const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'))
export const ComingSoonPage = lazy(() => import('@/pages/public/ComingSoonPage'))

// Authentification
export const LoginPage = lazy(() => import('@/pages/public/LoginPage'))
export const RegisterClientPage = lazy(() => import('@/pages/public/RegisterClientPage'))
export const RegisterArtisanPage = lazy(() => import('@/pages/public/RegisterArtisanPage'))
export const ForgotPasswordPage = lazy(() => import('@/pages/public/ForgotPasswordPage'))
export const ResetPasswordPage = lazy(() => import('@/pages/public/ResetPasswordPage'))

// Artisan
export const ArtisanPendingPage = lazy(() => import('@/pages/artisan/ArtisanPendingPage'))
