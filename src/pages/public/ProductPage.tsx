import {
  ChevronRightIcon,
  ImageIcon,
  MapPinIcon,
  MessageSquareTextIcon,
  PackageXIcon,
  ShoppingBagIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import { ArtisanLogo } from '@/components/common/ArtisanCard'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { FavoriteButton } from '@/components/common/FavoriteButton'
import { ProductGrid } from '@/components/common/ProductCard'
import { QuantityStepper } from '@/components/common/QuantityStepper'
import { RatingStars } from '@/components/common/RatingStars'
import { MyReviewPanel } from '@/components/reviews/MyReviewPanel'
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
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCartStore } from '@/stores/cart'
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
      <MyReviewPanel productId={productId} />
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
  usePageTitle(product.data?.name ?? (product.isPending ? null : 'Produit introuvable'))
  const others = useOtherArtisanProducts(product.data?.artisan.slug, product.data?.id)
  const [quantity, setQuantity] = useState(1)
  const navigate = useNavigate()
  const addToCart = useCartStore((state) => state.add)
  const inCart = useCartStore(
    (state) => state.items.find((item) => item.productId === product.data?.id)?.quantity ?? 0,
  )

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
  // Quantité encore ajoutable compte tenu de ce qui est déjà dans le panier
  const remaining = Math.max(0, p.stock - inCart)

  function handleAddToCart() {
    const wanted = Math.min(quantity, remaining)
    const added = addToCart(
      {
        productId: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        imagePath: p.images[0] ?? p.imagePath,
        artisanSlug: p.artisan.slug,
        artisanName: p.artisan.shop_name,
        stock: p.stock,
      },
      wanted,
    )
    setQuantity(1)
    if (added === 0) {
      toast.info('Tout le stock disponible est déjà dans votre panier.')
      return
    }
    toast.success(`${added} × « ${p.name} » ajouté${added > 1 ? 's' : ''} au panier.`, {
      action: { label: 'Voir le panier', onClick: () => navigate('/panier') },
    })
  }

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

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              {!outOfStock && remaining > 0 && (
                <QuantityStepper
                  value={Math.min(quantity, remaining)}
                  max={remaining}
                  onChange={setQuantity}
                />
              )}
              <Button size="lg" disabled={outOfStock || remaining === 0} onClick={handleAddToCart}>
                <ShoppingBagIcon />
                {outOfStock ? 'Indisponible' : 'Ajouter au panier'}
              </Button>
              <FavoriteButton productId={p.id} productName={p.name} withLabel />
            </div>
            {inCart > 0 && (
              <p className="text-sm text-muted-foreground">
                Déjà {inCart} dans{' '}
                <Link to="/panier" className="text-sidi-bou hover:underline">
                  votre panier
                </Link>
                {remaining === 0 && ' (tout le stock disponible)'}.
              </p>
            )}
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
