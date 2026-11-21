import { EyeOffIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { RatingStars } from '@/components/common/RatingStars'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useCanReview, useDeleteReview, useMyReviews } from '@/features/reviews/api'
import { useProfile } from '@/hooks/useProfile'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/format'

/**
 * CLI-6 — Bloc « Votre avis » d'un produit : visible pour un client seulement.
 * Formulaire si le produit a été livré, sinon simple explication.
 */
export function MyReviewPanel({ productId }: { productId: number }) {
  const { profile } = useProfile()
  const myReviews = useMyReviews()
  const canReview = useCanReview(productId)
  const remove = useDeleteReview()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (profile?.role !== 'client' || myReviews.isPending || canReview.isPending) return null

  const review = myReviews.data?.get(productId) ?? null

  if (!review && !canReview.data) {
    return (
      <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
        Vous pourrez donner votre avis sur ce produit après l’avoir reçu.
      </p>
    )
  }

  return (
    <section aria-labelledby="mon-avis" className="space-y-3 rounded-2xl border bg-card p-4 sm:p-5">
      <h3 id="mon-avis" className="font-sans text-base font-semibold tracking-normal">
        Votre avis
      </h3>

      {editing || !review ? (
        <ReviewForm
          productId={productId}
          existing={review}
          onDone={() => setEditing(false)}
          onCancel={review ? () => setEditing(false) : undefined}
        />
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <RatingStars rating={review.rating} />
            <span className="text-xs text-muted-foreground">
              {review.updated_at !== review.created_at ? 'Modifié le ' : 'Publié le '}
              {formatDate(review.updated_at)}
            </span>
          </div>
          {review.comment && <p className="text-sm whitespace-pre-line">{review.comment}</p>}
          {review.is_hidden && (
            <p className="inline-flex items-center gap-1.5 text-sm text-destructive">
              <EyeOffIcon className="size-4" aria-hidden="true" />
              Cet avis a été masqué par la modération : il n’est pas visible publiquement.
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <PencilIcon />
              Modifier
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2Icon />
              Supprimer
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer votre avis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Votre note et votre commentaire seront définitivement supprimés. Vous pourrez en
              publier un nouveau ensuite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                review &&
                remove.mutate(review.id, {
                  onSuccess: () => toast.success('Votre avis a été supprimé.'),
                  onError: (error) => toast.error(getErrorMessage(error)),
                })
              }
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
