import { BanIcon, CheckIcon, RotateCcwIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useSetArtisanStatus } from '@/features/admin/api'
import { getErrorMessage } from '@/lib/errors'
import type { ArtisanStatus } from '@/lib/labels'

type Dialog = 'reject' | 'suspend' | null

/** ADM-2 — Approuver, refuser (motif obligatoire), suspendre, réactiver. */
export function ArtisanStatusActions({
  artisanId,
  shopName,
  status,
  size = 'sm',
}: {
  artisanId: string
  shopName: string
  status: ArtisanStatus
  size?: 'sm' | 'default'
}) {
  const setStatus = useSetArtisanStatus()
  const [dialog, setDialog] = useState<Dialog>(null)

  function apply(next: ArtisanStatus, message: string, reason?: string) {
    setStatus.mutate(
      { artisanId, status: next, reason },
      {
        onSuccess: () => {
          toast.success(message)
          setDialog(null)
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(status === 'pending' || status === 'rejected') && (
        <Button
          size={size}
          disabled={setStatus.isPending}
          onClick={() => apply('approved', `« ${shopName} » est approuvée.`)}
        >
          <CheckIcon />
          Approuver
        </Button>
      )}
      {status === 'pending' && (
        <Button
          size={size}
          variant="outline"
          className="text-destructive"
          disabled={setStatus.isPending}
          onClick={() => setDialog('reject')}
        >
          <XIcon />
          Refuser
        </Button>
      )}
      {status === 'approved' && (
        <Button
          size={size}
          variant="outline"
          className="text-destructive"
          disabled={setStatus.isPending}
          onClick={() => setDialog('suspend')}
        >
          <BanIcon />
          Suspendre
        </Button>
      )}
      {status === 'suspended' && (
        <Button
          size={size}
          variant="outline"
          disabled={setStatus.isPending}
          onClick={() => apply('approved', `« ${shopName} » est réactivée.`)}
        >
          <RotateCcwIcon />
          Réactiver
        </Button>
      )}

      <ConfirmDialog
        open={dialog === 'reject'}
        onOpenChange={(open) => !open && setDialog(null)}
        title={`Refuser « ${shopName} » ?`}
        description="L’artisan verra ce motif et pourra corriger sa boutique avant de renvoyer sa demande."
        reasonLabel="Motif du refus"
        reasonRequired
        confirmLabel="Refuser la boutique"
        destructive
        pending={setStatus.isPending}
        onConfirm={(reason) => apply('rejected', `« ${shopName} » a été refusée.`, reason)}
      />
      <ConfirmDialog
        open={dialog === 'suspend'}
        onOpenChange={(open) => !open && setDialog(null)}
        title={`Suspendre « ${shopName} » ?`}
        description="Tous ses produits disparaîtront aussitôt du catalogue. Ses commandes en cours restent visibles par lui et par l’administration."
        confirmLabel="Suspendre la boutique"
        destructive
        pending={setStatus.isPending}
        onConfirm={() => apply('suspended', `« ${shopName} » est suspendue.`)}
      />
    </div>
  )
}
