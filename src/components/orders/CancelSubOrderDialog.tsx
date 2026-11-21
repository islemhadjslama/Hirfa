import { Loader2Icon } from 'lucide-react'
import { useId, useState } from 'react'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'

type CancelSubOrderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Motif obligatoire (artisan, ART-7) ou facultatif (client). */
  reasonRequired: boolean
  pending: boolean
  onConfirm: (reason: string) => void
  description: string
}

/** Confirmation d'annulation avec motif (le stock est restauré par la RPC). */
export function CancelSubOrderDialog({
  open,
  onOpenChange,
  reasonRequired,
  pending,
  onConfirm,
  description,
}: CancelSubOrderDialogProps) {
  const fieldId = useId()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string>()

  function handleOpenChange(next: boolean) {
    if (!next) {
      setReason('')
      setError(undefined)
    }
    onOpenChange(next)
  }

  function confirm() {
    const value = reason.trim()
    if (reasonRequired && value.length < 3) {
      setError('Le motif d’annulation est obligatoire.')
      return
    }
    onConfirm(value)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler cette commande ?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5">
          <label htmlFor={fieldId} className="text-sm font-medium">
            Motif d’annulation{reasonRequired ? '' : ' (facultatif)'}
          </label>
          <Textarea
            id={fieldId}
            rows={3}
            value={reason}
            maxLength={500}
            aria-invalid={Boolean(error)}
            onChange={(event) => {
              setReason(event.target.value)
              setError(undefined)
            }}
            placeholder={reasonRequired ? 'Ex. pièce cassée pendant la préparation' : ''}
          />
          {error && <FieldError>{error}</FieldError>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Retour</AlertDialogCancel>
          <Button variant="destructive" disabled={pending} onClick={confirm}>
            {pending && <Loader2Icon className="animate-spin" />}
            Annuler la commande
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
