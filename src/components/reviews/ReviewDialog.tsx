import { useState } from 'react'

import { ReviewForm } from '@/components/reviews/ReviewForm'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { MyReview } from '@/features/reviews/api'

/** Bouton « Donner / Modifier mon avis » + fenêtre (détail d'une commande livrée). */
export function ReviewDialogButton({
  productId,
  productName,
  existing,
}: {
  productId: number
  productName: string
  existing: MyReview | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {existing ? 'Modifier mon avis' : 'Donner mon avis'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{existing ? 'Modifier mon avis' : 'Donner mon avis'}</DialogTitle>
            <DialogDescription>{productName}</DialogDescription>
          </DialogHeader>
          {open && (
            <ReviewForm
              productId={productId}
              existing={existing}
              onDone={() => setOpen(false)}
              onCancel={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
