import {
  ChevronRightIcon,
  ImageIcon,
  MapPinIcon,
  MessageSquareTextIcon,
  MinusIcon,
  PackageXIcon,
  PlusIcon,
  ShoppingBagIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'

import { ArtisanLogo } from '@/components/common/ArtisanCard'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { FavoriteButton } from '@/components/common/FavoriteButton'
import { ProductGrid } from '@/components/common/ProductCard'
import { RatingStars } from '@/components/common/RatingStars'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  recordProductView,
  useOtherArtisanProducts,
  useProductDetails,
  useProductReviews,
  type ProductDetails,
} from '@/features/catalog/api'
import { formatDate, formatPrice } from '@/lib/format'
import { publicUrl } from '@/lib/storage'
import { cn } from '@/lib/utils'

function Gallery({ product }: { product: ProductDetails }) {
  const [active, setActive] = useState(0)
  const images = product.images

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border bg-muted">
        <ImageIcon className="size-12 text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-2xl border bg-muted">
        <img
          src={publicUrl('product-images', images[active])}
          alt={`${product.name} — photo ${active + 1} sur ${images.length}`}
          className="size-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2" aria-label="Autres photos">
          {images.map((path, index) => (
            <li key={path}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Afficher la photo ${index + 1}`}
                aria-current={index === active}
                className={cn(
                  'aspect-square w-full overflow-hidden rounded-lg border-2 bg-muted transition',
                  index === active
                    ? 'border-primary'
                    : 'border-transparent opacity-75 hover:opacity-100',
                )}
              >
                <img
                  src={publicUrl('product-images', path)}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function QuantitySelector({
  value,
  max,
  onChange,
}: {
  value: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className="inline-flex items-center rounded-lg border bg-card">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label="Diminuer la quantité"
      >
        <MinusIcon />
      </Button>
      <label htmlFor="quantity" className="sr-only">
        Quantité
      </label>
      <input
        id="quantity"
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        onChange={(event) => {
          const next = Math.trunc(Number(event.target.value))
          if (Number.isFinite(next)) onChange(Math.min(max, Math.max(1, next)))
        }}
        className="w-12 [appearance:textfield] bg-transparent text-center font-medium outline-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Augmenter la quantité"
      >
        <PlusIcon />
      </Button>
    </div>
  )
}

function Reviews({
  productId,
  avgRating,
  count,
}: {
  productId: number
  avgRating: number
  count: number
}) {
  const reviews = useProductReviews(productId)

  return (
    <section aria-labelledby="avis" className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="avis" className="text-2xl font-semibold">
          Avis clients
        </h2>
        {count > 0 && <RatingStars rating={avgRating} count={count} size="md" />}
      </div>
      {reviews.isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : reviews.isError ? (
        <ErrorState onRetry={() => void reviews.refetch()} />
      ) : reviews.data.length === 0 ? (
        <EmptyState
          icon={MessageSquareTextIcon}
          title="Pas encore d’avis"
          description="Les clients peuvent laisser un avis après avoir reçu ce produit."
        />
      ) : (
        <ul className="space-y-3">
          {reviews.data.map((review) => (
            <li key={review.id} className="rounded-2xl border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{review.author_name}</p>
                <time className="text-xs text-muted-foreground" dateTime={review.created_at}>
                  {formatDate(review.created_at)}
                </time>
              </div>
              <RatingStars rating={review.rating} className="mt-1" />
              {review.comment && (
                <p className="mt-2 text-sm whitespace-pre-line">{review.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ProductSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 md:grid-cols-2">
      <Skeleton className="aspect-square rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}

/** CAT-6 — Fiche produit. */
export default function ProductPage() {
  const { slug } = useParams()
  // `key` : quantité et galerie repartent de zéro en passant d'un produit à un autre
  return <ProductView key={slug} slug={slug} />
}

function ProductView({ slug }: { slug: string | undefined }) {
  const product = useProductDetails(slug)
  const others = useOtherArtisanProducts(product.data?.artisan.slug, product.data?.id)
  const [quantity, setQuantity] = useState(1)

  // +1 vue, une seule fois par produit affiché (ignorée pour le propriétaire)
  const viewed = useRef<number | null>(null)
  const productId = product.data?.id
  useEffect(() => {
    if (productId === undefined || viewed.current === productId) return
    viewed.current = productId
    void recordProductView(productId)
  }, [productId])

  if (product.isPending) return <ProductSkeleton />
  if (product.isError) return <ErrorState onRetry={() => void product.refetch()} />
  if (!product.data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState
          icon={PackageXIcon}
          title="Produit introuvable"
          description="Ce produit n’existe pas ou n’est plus disponible."
          action={
            <Button asChild>
              <Link to="/catalogue">Parcourir le catalogue</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const p = product.data
  const outOfStock = p.stock === 0
  const place = [p.artisan.city, p.artisan.governorate].filter(Boolean).join(', ')

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6">
      <nav aria-label="Fil d’Ariane" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link to="/catalogue" className="hover:text-primary">
              Catalogue
            </Link>
          </li>
          <ChevronRightIcon className="size-4" aria-hidden="true" />
          <li>
            <Link to={`/catalogue?categorie=${p.categorySlug}`} className="hover:text-primary">
              {p.categoryName}
            </Link>
          </li>
          <ChevronRightIcon className="size-4" aria-hidden="true" />
          <li aria-current="page" className="truncate text-foreground">
            {p.name}
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
        <Gallery product={p} />

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold sm:text-4xl">{p.name}</h1>
            <p className="text-sm text-muted-foreground">
              par{' '}
              <Link
                to={`/artisans/${p.artisan.slug}`}
                className="font-medium text-sidi-bou hover:underline"
              >
                {p.artisan.shop_name}
              </Link>
            </p>
            {p.reviewsCount > 0 && (
              <a href="#avis" className="inline-block">
                <RatingStars rating={p.avgRating} count={p.reviewsCount} />
              </a>
            )}
          </div>

          <p className="text-3xl font-semibold text-primary">{formatPrice(p.price)}</p>

          <p className={cn('text-sm font-medium', outOfStock ? 'text-destructive' : 'text-olive')}>
            {outOfStock
              ? 'Rupture de stock'
              : `En stock : ${p.stock} disponible${p.stock > 1 ? 's' : ''}`}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {!outOfStock && (
              <QuantitySelector value={quantity} max={p.stock} onChange={setQuantity} />
            )}
            <Button
              size="lg"
              disabled={outOfStock}
              // Le panier est réalisé en Phase 5
              onClick={() => toast.info('Le panier sera bientôt disponible.')}
            >
              <ShoppingBagIcon />
              {outOfStock ? 'Indisponible' : 'Ajouter au panier'}
            </Button>
            <FavoriteButton productId={p.id} productName={p.name} withLabel />
          </div>

          <p className="rounded-xl bg-secondary px-4 py-3 text-sm">
            Paiement <strong>à la livraison</strong>. Expédié directement par l’artisan.
          </p>

          <div className="space-y-2">
            <h2 className="font-sans text-sm font-semibold tracking-normal">Description</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">
              {p.description}
            </p>
            <p className="text-sm text-muted-foreground">
              Catégorie :{' '}
              <Link
                to={`/catalogue?categorie=${p.categorySlug}`}
                className="text-sidi-bou hover:underline"
              >
                {p.categoryName}
              </Link>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-4">
            <ArtisanLogo artisan={p.artisan} className="size-14" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-lg font-semibold">{p.artisan.shop_name}</p>
              {place && (
                <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPinIcon className="size-4" aria-hidden="true" />
                  {place}
                </p>
              )}
            </div>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link to={`/artisans/${p.artisan.slug}`}>Voir la boutique</Link>
            </Button>
          </div>
        </div>
      </div>

      <Reviews productId={p.id} avgRating={p.avgRating} count={p.reviewsCount} />

      {others.data && others.data.length > 0 && (
        <section aria-labelledby="autres-produits" className="space-y-4">
          <h2 id="autres-produits" className="text-2xl font-semibold">
            Autres produits de cet artisan
          </h2>
          <ProductGrid products={others.data} />
        </section>
      )}
    </div>
  )
}
