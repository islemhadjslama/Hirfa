import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { TextareaField } from '@/components/common/TextareaField'
import { StarRatingInput } from '@/components/reviews/StarRatingInput'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { useSaveReview, type MyReview } from '@/features/reviews/api'
import { reviewSchema, type ReviewValues } from '@/features/reviews/schemas'
import { getErrorMessage } from '@/lib/errors'

type ReviewFormProps = {
  productId: number
  existing: MyReview | null
  onDone: () => void
  onCancel?: () => void
}

/** CLI-6 — Création ou modification de son avis. */
export function ReviewForm({ productId, existing, onDone, onCancel }: ReviewFormProps) {
  const errorId = useId()
  const save = useSaveReview()
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: existing?.rating ?? 0, comment: existing?.comment ?? '' },
  })

  const onSubmit = handleSubmit((values) =>
    save.mutate(
      { productId, reviewId: existing?.id ?? null, values },
      {
        onSuccess: () => {
          toast.success(existing ? 'Votre avis a été modifié.' : 'Merci pour votre avis !')
          onDone()
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    ),
  )

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4">
      <div>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <StarRatingInput
              value={field.value}
              onChange={field.onChange}
              invalid={Boolean(errors.rating)}
              describedBy={errors.rating ? errorId : undefined}
            />
          )}
        />
        {errors.rating && <FieldError id={errorId}>{errors.rating.message}</FieldError>}
      </div>
      <TextareaField
        label="Votre commentaire (facultatif)"
        rows={4}
        placeholder="Qualité, finitions, emballage, échanges avec l’artisan…"
        error={errors.comment?.message}
        {...register('comment')}
      />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={save.isPending}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2Icon className="animate-spin" />}
          {existing ? 'Enregistrer mon avis' : 'Publier mon avis'}
        </Button>
      </div>
    </form>
  )
}
