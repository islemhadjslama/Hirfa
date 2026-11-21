import { MapPinIcon, StoreIcon } from 'lucide-react'
import { Link } from 'react-router'

import { Skeleton } from '@/components/ui/skeleton'
import type { PublicArtisan } from '@/features/catalog/api'

export function ArtisanLogo({
  artisan,
  className = 'size-16',
}: {
  artisan: Pick<PublicArtisan, 'logo_url' | 'shop_name'>
  className?: string
}) {
  return artisan.logo_url ? (
    <img
      src={artisan.logo_url}
      alt={`Logo de ${artisan.shop_name}`}
      loading="lazy"
      className={`${className} shrink-0 rounded-full border-2 border-card bg-card object-cover`}
    />
  ) : (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full border-2 border-card bg-secondary font-heading text-xl font-semibold text-primary`}
      aria-hidden="true"
    >
      {artisan.shop_name.charAt(0).toUpperCase()}
    </span>
  )
}

/** Carte d'un artisan (liste des artisans, accueil). */
export function ArtisanCard({ artisan }: { artisan: PublicArtisan }) {
  const place = [artisan.city, artisan.governorate].filter(Boolean).join(', ')
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition hover:shadow-md">
      <div className="h-20 bg-secondary">
        {artisan.banner_url && (
          <img src={artisan.banner_url} alt="" loading="lazy" className="size-full object-cover" />
        )}
      </div>
      <div className="-mt-8 flex flex-1 flex-col gap-2 px-4 pb-4">
        <ArtisanLogo artisan={artisan} />
        <h3 className="font-heading text-lg font-semibold">
          <Link
            to={`/artisans/${artisan.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {artisan.shop_name}
          </Link>
        </h3>
        {artisan.specialty && (
          <p className="inline-flex items-center gap-1.5 text-sm text-olive">
            <StoreIcon className="size-4" aria-hidden="true" />
            {artisan.specialty.name}
          </p>
        )}
        {place && (
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPinIcon className="size-4" aria-hidden="true" />
            {place}
          </p>
        )}
        {artisan.bio && <p className="line-clamp-2 text-sm text-muted-foreground">{artisan.bio}</p>}
      </div>
    </article>
  )
}

export function ArtisanCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <Skeleton className="h-20 rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}
