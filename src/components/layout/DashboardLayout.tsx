import type { LucideIcon } from 'lucide-react'
import { ExternalLinkIcon, MenuIcon } from 'lucide-react'
import { Suspense, useState } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router'

import { Logo } from '@/components/common/Logo'
import { PageLoader } from '@/components/common/PageLoader'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export type DashboardNavItem = {
  to: string
  label: string
  icon: LucideIcon
  /** `true` pour ne marquer le lien actif que sur la route exacte. */
  end?: boolean
}

type DashboardLayoutProps = {
  /** Titre de l'espace, ex. « Espace artisan ». */
  title: string
  homePath: string
  navItems: DashboardNavItem[]
}

function SidebarNav({
  navItems,
  onNavigate,
}: {
  navItems: DashboardNavItem[]
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Menu de l'espace">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
            )
          }
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

/** Layout commun aux espaces artisan et admin : sidebar fixe sur desktop, tiroir sur mobile. */
export function DashboardLayout({ title, homePath, navItems }: DashboardLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-svh flex-col gap-6 border-r bg-sidebar p-4 lg:flex">
        <Logo to={homePath} />
        <p className="px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </p>
        <SidebarNav navItems={navItems} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Ouvrir le menu">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar">
              <SheetHeader>
                <SheetTitle className="sr-only">{title}</SheetTitle>
                <Logo to={homePath} />
              </SheetHeader>
              <div className="px-4">
                <SidebarNav navItems={navItems} onNavigate={() => setMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <p className="truncate font-heading text-lg font-semibold">{title}</p>

          <Button variant="outline" size="sm" asChild className="ml-auto">
            <Link to="/">
              <ExternalLinkIcon />
              <span className="hidden sm:inline">Voir le site</span>
              <span className="sr-only sm:hidden">Voir le site</span>
            </Link>
          </Button>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <ScrollRestoration />
    </div>
  )
}
