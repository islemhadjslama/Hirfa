import { EyeOffIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { PRODUCT_STATUS_LABELS, type ProductStatus } from '@/lib/labels'
import { cn } from '@/lib/utils'

/** Statut d'un produit + badge « Masqué par l'admin » (ART-3). */
export function ProductStatusBadge({
  status,
  adminHidden,
}: {
  status: ProductStatus
  adminHidden?: boolean
}) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      <Badge
        variant="secondary"
        className={cn(status === 'published' && 'bg-olive text-white hover:bg-olive')}
      >
        {PRODUCT_STATUS_LABELS[status]}
      </Badge>
      {adminHidden && (
        <Badge variant="destructive">
          <EyeOffIcon aria-hidden="true" />
          Masqué par l’admin
        </Badge>
      )}
    </span>
  )
}
