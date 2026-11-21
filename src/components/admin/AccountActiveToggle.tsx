import { PowerIcon, PowerOffIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { AccountStatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { useSetAccountActive } from '@/features/admin/api'
import { getErrorMessage } from '@/lib/errors'

/** ADM-3 — Activer / désactiver un compte (confirmation avant désactivation). */
export function AccountActiveToggle({
  userId,
  name,
  active,
}: {
  userId: string
  name: string
  active: boolean
}) {
  const setActive = useSetAccountActive()
  const [confirm, setConfirm] = useState(false)

  function apply(next: boolean) {
    setActive.mutate(
      { userId, active: next },
      {
        onSuccess: () => {
          toast.success(
            next ? `Le compte de ${name} est réactivé.` : `Le compte de ${name} est désactivé.`,
          )
          setConfirm(false)
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AccountStatusBadge active={active} />
      {active ? (
        <Button
          variant="outline"
          size="sm"
          className="text-destructive"
          disabled={setActive.isPending}
          onClick={() => setConfirm(true)}
        >
          <PowerOffIcon />
          Désactiver
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={setActive.isPending}
          onClick={() => apply(true)}
        >
          <PowerIcon />
          Réactiver
        </Button>
      )}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Désactiver le compte de ${name} ?`}
        description="La personne sera déconnectée et ne pourra plus se connecter ni commander. Ses commandes passées restent consultables."
        confirmLabel="Désactiver le compte"
        destructive
        pending={setActive.isPending}
        onConfirm={() => apply(false)}
      />
    </div>
  )
}
