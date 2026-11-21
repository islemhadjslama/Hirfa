import { Suspense } from 'react'
import { Outlet } from 'react-router'

import { PageLoader } from '@/components/common/PageLoader'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'

export function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Aller au contenu
      </a>
      <Header />
      <main id="contenu" className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
