import { lazy } from 'react'

// Pages chargées à la demande (React.lazy) — cahier des charges §8, performance.
export const HomePage = lazy(() => import('@/pages/public/HomePage'))
export const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'))
export const ComingSoonPage = lazy(() => import('@/pages/public/ComingSoonPage'))
