import { TriangleAlertIcon } from 'lucide-react'

import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'

type ErrorStateProps = {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Impossible de charger les données',
  description = 'Vérifiez votre connexion internet puis réessayez.',
  onRetry,
}: ErrorStateProps) {
  return (
    <EmptyState
      icon={TriangleAlertIcon}
      title={title}
      description={description}
      className="m-4"
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Réessayer
          </Button>
        )
      }
    />
  )
}
