import { Link } from 'react-router'

import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
  to?: string
}

/** Logo Hirfa : motif d'arche (inspiré des portes tunisiennes) + nom en serif. */
export function Logo({ className, to = '/' }: LogoProps) {
  return (
    <Link
      to={to}
      className={cn('inline-flex items-center gap-2 rounded-md text-foreground', className)}
      aria-label="Hirfa — accueil"
    >
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <path d="M4 30V14a12 12 0 0 1 24 0v16Z" fill="var(--hirfa-sidi-bou)" />
        <path d="M9 30V15a7 7 0 0 1 14 0v15Z" fill="var(--hirfa-sand)" />
        <circle cx="16" cy="15" r="2.2" fill="var(--hirfa-terracotta)" />
        <path d="M12 30v-7h8v7" fill="var(--hirfa-terracotta)" />
      </svg>
      <span className="font-heading text-2xl font-semibold tracking-tight">Hirfa</span>
    </Link>
  )
}
