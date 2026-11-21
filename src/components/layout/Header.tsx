import { LogOutIcon, MenuIcon, ShoppingBagIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router'

import { Logo } from '@/components/common/Logo'
import { SearchBar } from '@/components/layout/SearchBar'
import { UserMenu } from '@/components/layout/UserMenu'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { accountLinksFor } from '@/features/auth/account-links'
import { useSignOut } from '@/features/auth/useSignOut'
import { useProfile } from '@/hooks/useProfile'
import { cn } from '@/lib/utils'
import { selectCartCount, useCartStore } from '@/stores/cart'

const NAV_LINKS = [
  { to: '/catalogue', label: 'Catalogue' },
  { to: '/artisans', label: 'Artisans' },
]

const GUEST_LINK = { to: '/artisan/inscription', label: 'Devenir artisan' }

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary',
    isActive ? 'text-primary' : 'text-foreground/80',
  )
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)
  const { profile } = useProfile()
  const handleSignOut = useSignOut()
  const cartCount = useCartStore(selectCartCount)

  const mainLinks = profile ? NAV_LINKS : [...NAV_LINKS, GUEST_LINK]
  const accountLinks = profile
    ? accountLinksFor(profile)
    : [
        { to: '/connexion', label: 'Connexion' },
        { to: '/inscription', label: 'Créer un compte' },
      ]

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
              {mainLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={navLinkClass} onClick={closeMenu}>
                  {link.label}
                </NavLink>
              ))}
              <Separator className="my-2" />
              {accountLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={navLinkClass} onClick={closeMenu}>
                  {link.label}
                </NavLink>
              ))}
              {profile && (
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-foreground/80 hover:text-primary"
                  onClick={() => {
                    closeMenu()
                    void handleSignOut()
                  }}
                >
                  <LogOutIcon className="size-4" aria-hidden="true" />
                  Déconnexion
                </button>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <Logo />

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          {mainLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <SearchBar id="header-search" className="ml-auto hidden w-full max-w-xs lg:block" />

        <div className="ml-auto flex items-center gap-1 lg:ml-2">
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link
              to="/panier"
              aria-label={
                cartCount > 0
                  ? `Panier : ${cartCount} article${cartCount > 1 ? 's' : ''}`
                  : 'Panier vide'
              }
            >
              <ShoppingBagIcon />
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground"
                  aria-hidden="true"
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </Button>
          <UserMenu />
        </div>
      </div>

      {/* Recherche sous le header sur mobile et tablette */}
      <div className="border-t px-4 py-2 sm:px-6 lg:hidden">
        <SearchBar id="header-search-mobile" />
      </div>
    </header>
  )
}
