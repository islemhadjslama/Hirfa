import { MessageSquareTextIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { RatingStars } from '@/components/common/RatingStars'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { useArtisanReviews } from '@/features/reviews/api'
import { useProfile } from '@/hooks/useProfile'
import { formatDate } from '@/lib/format'

const ratingFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

/** ART-9 — Avis reçus sur ses produits (lecture seule, avis masqués exclus). */
export default function ArtisanReviewsPage() {
  const { profile } = useProfile()
  const reviews = useArtisanReviews(profile?.id)
  const [productId, setProductId] = useState('')

  const products = useMemo(() => {
    const map = new Map<number, string>()
    for (const review of reviews.data ?? []) map.set(review.product.id, review.product.name)
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'fr'))
  }, [reviews.data])

  const list = (reviews.data ?? []).filter(
    (review) => !productId || String(review.product.id) === productId,
  )
  const average = list.length ? list.reduce((sum, r) => sum + r.rating, 0) / list.length : 0
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: list.filter((review) => review.rating === star).length,
  }))

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Avis reçus" description="Ce que vos clients pensent de vos créations." />

      {reviews.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : reviews.isError ? (
        <ErrorState onRetry={() => void reviews.refetch()} />
      ) : reviews.data.length === 0 ? (
        <EmptyState
          icon={MessageSquareTextIcon}
          title="Aucun avis pour l’instant"
          description="Vos clients pourront laisser un avis une fois leur commande livrée."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 rounded-2xl border bg-card p-4 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8">
            <div className="text-center">
              <p className="font-heading text-4xl font-semibold">
                {ratingFormatter.format(average)}
              </p>
              <RatingStars rating={average} size="md" />
              <p className="text-sm text-muted-foreground">
                {list.length} avis{productId ? ' pour ce produit' : ''}
              </p>
            </div>
            <ul className="space-y-1" aria-label="Répartition des notes">
              {distribution.map(({ star, count }) => (
                <li key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-16 shrink-0">
                    {star} étoile{star > 1 ? 's' : ''}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-amber-500"
                      style={{ width: `${list.length ? (count / list.length) * 100 : 0}%` }}
                    />
                  </span>
                  <span className="w-6 text-right text-muted-foreground">{count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="reviews-product" className="text-sm text-muted-foreground">
              Produit
            </label>
            <NativeSelect
              id="reviews-product"
              className="w-full sm:w-72"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
            >
              <NativeSelectOption value="">Tous mes produits</NativeSelectOption>
              {products.map(([id, name]) => (
                <NativeSelectOption key={id} value={String(id)}>
                  {name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <ul className="space-y-3">
            {list.map((review) => (
              <li key={review.id} className="space-y-2 rounded-2xl border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    to={`/produits/${review.product.slug}`}
                    className="font-medium hover:text-primary"
                  >
                    {review.product.name}
                  </Link>
                  <time className="text-xs text-muted-foreground" dateTime={review.created_at}>
                    {formatDate(review.created_at)}
                  </time>
                </div>
                <div className="flex items-center gap-2">
                  <RatingStars rating={review.rating} />
                  <span className="text-sm text-muted-foreground">{review.author_name}</span>
                </div>
                {review.comment && <p className="text-sm whitespace-pre-line">{review.comment}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
