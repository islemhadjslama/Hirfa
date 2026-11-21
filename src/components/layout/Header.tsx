import { MenuIcon, ShoppingBagIcon, UserIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router'

import { Logo } from '@/components/common/Logo'
import { SearchBar } from '@/components/layout/SearchBar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/catalogue', label: 'Catalogue' },
  { to: '/artisans', label: 'Artisans' },
  { to: '/artisan/inscription', label: 'Devenir artisan' },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary',
    isActive ? 'text-primary' : 'text-foreground/80',
  )
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Ouvrir le menu">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Logo />
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4" aria-label="Navigation mobile">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} className={navLinkClass} onClick={closeMenu}>
                  {link.label}
                </NavLink>
              ))}
              <NavLink to="/connexion" className={navLinkClass} onClick={closeMenu}>
                Connexion
              </NavLink>
            </nav>
          </SheetContent>
        </Sheet>

        <Logo />

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <SearchBar id="header-search" className="ml-auto hidden w-full max-w-xs lg:block" />

        <div className="ml-auto flex items-center gap-1 lg:ml-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/panier" aria-label="Panier">
              <ShoppingBagIcon />
            </Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/connexion">
              <UserIcon />
              Connexion
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="sm:hidden">
            <Link to="/connexion" aria-label="Connexion">
              <UserIcon />
            </Link>
          </Button>
        </div>
      </div>

      {/* Recherche sous le header sur mobile et tablette */}
      <div className="border-t px-4 py-2 sm:px-6 lg:hidden">
        <SearchBar id="header-search-mobile" />
      </div>
    </header>
  )
}
