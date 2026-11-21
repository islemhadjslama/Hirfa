import { ImageIcon } from 'lucide-react'
import { Link } from 'react-router'

import { FavoriteButton } from '@/components/common/FavoriteButton'
import { RatingStars } from '@/components/common/RatingStars'
import { Skeleton } from '@/components/ui/skeleton'
import type { CatalogProduct } from '@/features/catalog/api'
import { formatPrice } from '@/lib/format'
import { publicUrl } from '@/lib/storage'

/** CAT-5 — Image, nom, prix, artisan, note, badge « Rupture », bouton favori. */
export function ProductCard({ product }: { product: CatalogProduct }) {
  const outOfStock = product.stock === 0

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.imagePath ? (
          <img
            src={publicUrl('product-images', product.imagePath)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-8 text-muted-foreground" aria-hidden="true" />
          </div>
        )}
        {outOfStock && (
          <span className="absolute top-2 left-2 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-medium text-white">
            Rupture
          </span>
        )}
      </div>
      <FavoriteButton
        productId={product.id}
        productName={product.name}
        className="absolute top-2 right-2 z-10"
      />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 font-sans text-sm font-medium tracking-normal">
          {/* Lien étendu à toute la carte */}
          <Link
            to={`/produits/${product.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {product.name}
          </Link>
        </h3>
        <p className="truncate text-xs text-muted-foreground">{product.artisanName}</p>
        {product.reviewsCount > 0 && (
          <RatingStars rating={product.avgRating} count={product.reviewsCount} />
        )}
        <p className="mt-auto pt-1 font-semibold text-primary">{formatPrice(product.price)}</p>
      </div>
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}

/** Grille responsive : 2 colonnes sur mobile, jusqu'à 4 sur grand écran. */
export function ProductGrid({
  products,
  loading,
  skeletons = 8,
  className = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
}: {
  products?: CatalogProduct[]
  loading?: boolean
  skeletons?: number
  className?: string
}) {
  return (
    <ul className={`grid gap-3 sm:gap-4 ${className}`}>
      {loading
        ? Array.from({ length: skeletons }, (_, index) => (
            <li key={index}>
              <ProductCardSkeleton />
            </li>
          ))
        : products?.map((product) => (
            <li key={product.id} className="flex">
              <div className="w-full [&>article]:h-full">
                <ProductCard product={product} />
              </div>
            </li>
          ))}
    </ul>
  )
}
