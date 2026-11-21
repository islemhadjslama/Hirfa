import {
  CalendarIcon,
  ExternalLinkIcon,
  MapPinIcon,
  MessageCircleIcon,
  PackageIcon,
  StoreIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { ArtisanLogo } from '@/components/common/ArtisanCard'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ProductGrid } from '@/components/common/ProductCard'
import { RatingStars } from '@/components/common/RatingStars'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useArtisanShop } from '@/features/catalog/api'
import { PRODUCTS_PER_PAGE } from '@/lib/constants'
import { formatDate } from '@/lib/format'

/** CAT-8 — Boutique publique d'un artisan. */
export default function ArtisanPublicPage() {
  const { slug } = useParams()
  // `key` : l'état local repart de zéro quand on passe d'une boutique à une autre
  return <ArtisanShopView key={slug} slug={slug} />
}

function ArtisanShopView({ slug }: { slug: string | undefined }) {
  const shop = useArtisanShop(slug)
  const [visible, setVisible] = useState(PRODUCTS_PER_PAGE)

  if (shop.isPending) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6">
        <Skeleton className="h-40 w-full rounded-2xl sm:h-56" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }
  if (shop.isError) return <ErrorState onRetry={() => void shop.refetch()} />
  if (!shop.data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState
          icon={StoreIcon}
          title="Boutique introuvable"
          description="Cette boutique n’existe pas ou n’est plus visible."
          action={
            <Button asChild>
              <Link to="/artisans">Voir tous les artisans</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const s = shop.data
  const place = [s.city, s.governorate].filter(Boolean).join(', ')
  const productCount = s.products.length
  const links = [
    s.whatsapp && {
      href: `https://wa.me/${s.whatsapp}`,
      label: 'WhatsApp',
      icon: MessageCircleIcon,
    },
    s.facebook_url && { href: s.facebook_url, label: 'Facebook', icon: ExternalLinkIcon },
    s.instagram_url && { href: s.instagram_url, label: 'Instagram', icon: ExternalLinkIcon },
  ].filter((link) => Boolean(link)) as { href: string; label: string; icon: typeof StoreIcon }[]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="h-36 overflow-hidden rounded-2xl bg-secondary sm:h-56">
        {s.banner_url && (
          <img
            src={s.banner_url}
            alt={`Bannière de ${s.shop_name}`}
            className="size-full object-cover"
          />
        )}
      </div>

      <div className="-mt-10 flex flex-col gap-4 px-2 sm:-mt-12 sm:flex-row sm:items-end sm:px-6">
        <ArtisanLogo artisan={s} className="size-20 border-4 sm:size-24" />
        <div className="min-w-0 flex-1 sm:pb-1">
          <h1 className="text-3xl font-semibold">{s.shop_name}</h1>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {s.specialty && (
              <Link
                to={`/catalogue?categorie=${s.specialty.slug}`}
                className="inline-flex items-center gap-1 text-olive hover:underline"
              >
                <StoreIcon className="size-4" aria-hidden="true" />
                {s.specialty.name}
              </Link>
            )}
            {place && (
              <span className="inline-flex items-center gap-1">
                <MapPinIcon className="size-4" aria-hidden="true" />
                {place}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <CalendarIcon className="size-4" aria-hidden="true" />
              Sur Hirfa depuis le {formatDate(s.created_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-3">
          {s.bio ? (
            <p className="leading-relaxed whitespace-pre-line text-foreground/90">{s.bio}</p>
          ) : (
            <p className="text-muted-foreground">
              Cet artisan n’a pas encore rédigé sa présentation.
            </p>
          )}
        </div>
        <aside className="space-y-4 rounded-2xl border bg-card p-4">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Produits</dt>
              <dd className="text-xl font-semibold">{productCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Note moyenne</dt>
              <dd>
                {s.reviewsCount > 0 ? (
                  <RatingStars rating={s.avgRating} count={s.reviewsCount} />
                ) : (
                  <span className="text-muted-foreground">Aucun avis</span>
                )}
              </dd>
            </div>
          </dl>
          {links.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {links.map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <Button variant="outline" size="sm" asChild>
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      <Icon />
                      {label}
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <section aria-labelledby="produits-boutique" className="mt-10 space-y-4">
        <h2 id="produits-boutique" className="text-2xl font-semibold">
          Ses créations
        </h2>
        {productCount === 0 ? (
          <EmptyState
            icon={PackageIcon}
            title="Aucun produit pour l’instant"
            description="Revenez bientôt : cet artisan prépare ses premières pièces."
          />
        ) : (
          <>
            <ProductGrid products={s.products.slice(0, visible)} />
            {visible < productCount && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setVisible((v) => v + PRODUCTS_PER_PAGE)}>
                  Voir plus de produits ({productCount - visible})
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
