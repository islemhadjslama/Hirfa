import { MailIcon, MapPinIcon } from 'lucide-react'
import { Link } from 'react-router'

import { Logo } from '@/components/common/Logo'
import { CONTACT_EMAIL } from '@/lib/constants'

const FOOTER_SECTIONS = [
  {
    title: 'Découvrir',
    links: [
      { to: '/catalogue', label: 'Catalogue' },
      { to: '/artisans', label: 'Nos artisans' },
      { to: '/panier', label: 'Mon panier' },
    ],
  },
  {
    title: 'Artisans',
    links: [
      { to: '/artisan/inscription', label: 'Ouvrir ma boutique' },
      { to: '/connexion', label: 'Espace artisan' },
    ],
  },
  {
    title: 'Mon compte',
    links: [
      { to: '/connexion', label: 'Connexion' },
      { to: '/inscription', label: 'Créer un compte' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-secondary/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-3 sm:col-span-2 md:col-span-1">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            La vitrine en ligne des artisans tunisiens. Achetez directement auprès de ceux qui
            créent, et payez à la livraison.
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <MailIcon className="size-4" aria-hidden="true" />
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-primary">
                {CONTACT_EMAIL}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPinIcon className="size-4" aria-hidden="true" />
              Tunisie
            </li>
          </ul>
        </div>

        {FOOTER_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="mb-3 font-sans text-sm font-semibold tracking-normal">
              {section.title}
            </h2>
            <ul className="space-y-2 text-sm">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-muted-foreground hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} Hirfa — Projet académique réalisé dans un cadre pédagogique.
          Aucune transaction réelle.
        </p>
      </div>
    </footer>
  )
}
