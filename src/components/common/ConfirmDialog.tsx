import { Loader2Icon } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

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

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel: string
  destructive?: boolean
  pending?: boolean
  /** Si défini, un champ « motif » est affiché (obligatoire si `reasonRequired`). */
  reasonLabel?: string
  reasonRequired?: boolean
  onConfirm: (reason: string) => void
}

/** Confirmation avant une action sensible (§8), avec motif optionnel. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  pending,
  reasonLabel,
  reasonRequired,
  onConfirm,
}: ConfirmDialogProps) {
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
    if (reasonLabel && reasonRequired && reason.trim().length < 3) {
      setError('Le motif est obligatoire.')
      return
    }
    onConfirm(reason.trim())
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {reasonLabel && (
          <div className="space-y-1.5">
            <label htmlFor={fieldId} className="text-sm font-medium">
              {reasonLabel}
              {reasonRequired ? '' : ' (facultatif)'}
            </label>
            <Textarea
              id={fieldId}
              rows={3}
              maxLength={500}
              value={reason}
              aria-invalid={Boolean(error)}
              onChange={(event) => {
                setReason(event.target.value)
                setError(undefined)
              }}
            />
            {error && <FieldError>{error}</FieldError>}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            disabled={pending}
            onClick={confirm}
          >
            {pending && <Loader2Icon className="animate-spin" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
