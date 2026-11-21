import { EyeIcon, EyeOffIcon, MessageSquareTextIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { AdminFilter, AdminToolbar } from '@/components/admin/AdminToolbar'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { RatingStars } from '@/components/common/RatingStars'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ADMIN_PAGE_SIZE,
  useAdminDeleteReview,
  useAdminReviews,
  useSetReviewHidden,
} from '@/features/admin/api'
import { pageFromParams } from '@/features/admin/params'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/format'

type Visibility = 'all' | 'visible' | 'hidden'

/** ADM-7 — Modération des avis : masquer, afficher, supprimer. */
export default function AdminReviewsPage() {
  const [params] = useSearchParams()
  const visibilityParam = params.get('visibilite')
  const visibility: Visibility =
    visibilityParam === 'visible' || visibilityParam === 'hidden' ? visibilityParam : 'all'
  const page = pageFromParams(params)
  const reviews = useAdminReviews({ visibility, page })
  const setHidden = useSetReviewHidden()
  const remove = useAdminDeleteReview()
  const [toDelete, setToDelete] = useState<number | null>(null)
  const total = reviews.data?.total ?? 0

  function toggle(reviewId: number, hidden: boolean) {
    setHidden.mutate(
      { reviewId, hidden },
      {
        onSuccess: () =>
          toast.success(
            hidden ? 'Avis masqué : il n’est plus public.' : 'Avis de nouveau visible.',
          ),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Avis"
        description="Un avis masqué n’est plus visible publiquement ni compté dans les notes moyennes."
      />
      <AdminToolbar>
        <AdminFilter
          id="reviews-visibility"
          label="Visibilité"
          param="visibilite"
          value={visibility === 'all' ? '' : visibility}
          allLabel="Tous les avis"
          options={[
            { value: 'visible', label: 'Visibles' },
            { value: 'hidden', label: 'Masqués' },
          ]}
        />
      </AdminToolbar>

      {reviews.isPending ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : reviews.isError ? (
        <ErrorState onRetry={() => void reviews.refetch()} />
      ) : total === 0 ? (
        <EmptyState icon={MessageSquareTextIcon} title="Aucun avis" />
      ) : (
        <ul className="space-y-3">
          {reviews.data.rows.map((review) => (
            <li
              key={review.id}
              className={`space-y-2 rounded-2xl border bg-card p-4 ${review.is_hidden ? 'opacity-75' : ''}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {review.product && (
                    <Link
                      to={`/produits/${review.product.slug}`}
                      className="font-medium hover:text-primary"
                    >
                      {review.product.name}
                    </Link>
                  )}
                  {review.is_hidden && (
                    <Badge variant="destructive">
                      <EyeOffIcon aria-hidden="true" />
                      Masqué
                    </Badge>
                  )}
                </div>
                <time className="text-xs text-muted-foreground" dateTime={review.created_at}>
                  {formatDate(review.created_at)}
                </time>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <RatingStars rating={review.rating} />
                <span className="text-muted-foreground">
                  {review.client?.full_name} · {review.client?.email}
                </span>
              </div>
              {review.comment && <p className="text-sm whitespace-pre-line">{review.comment}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={setHidden.isPending}
                  onClick={() => toggle(review.id, !review.is_hidden)}
                >
                  {review.is_hidden ? <EyeIcon /> : <EyeOffIcon />}
                  {review.is_hidden ? 'Afficher' : 'Masquer'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setToDelete(review.id)}
                >
                  <Trash2Icon />
                  Supprimer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageCount={Math.ceil(total / ADMIN_PAGE_SIZE)} />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Supprimer cet avis ?"
        description="La suppression est définitive. Pour simplement le retirer du site, préférez « Masquer »."
        confirmLabel="Supprimer l’avis"
        destructive
        pending={remove.isPending}
        onConfirm={() =>
          toDelete !== null &&
          remove.mutate(toDelete, {
            onSuccess: () => {
              toast.success('Avis supprimé.')
              setToDelete(null)
            },
            onError: (error) => toast.error(getErrorMessage(error)),
          })
        }
      />
    </div>
  )
}
