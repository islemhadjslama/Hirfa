import { EyeOffIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  PRODUCT_STATUS_LABELS,
  SUB_ORDER_STATUS_LABELS,
  type ProductStatus,
  type SubOrderStatus,
} from '@/lib/labels'
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

const SUB_ORDER_STATUS_STYLES: Record<SubOrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-sky-100 text-sky-900',
  preparing: 'bg-violet-100 text-violet-900',
  shipped: 'bg-sidi-bou/15 text-sidi-bou',
  delivered: 'bg-olive/15 text-olive',
  cancelled: 'bg-destructive/10 text-destructive',
}

/** Statut d'une sous-commande, traduit et coloré. */
export function SubOrderStatusBadge({ status }: { status: SubOrderStatus }) {
  return (
    <Badge variant="secondary" className={SUB_ORDER_STATUS_STYLES[status]}>
      {SUB_ORDER_STATUS_LABELS[status]}
    </Badge>
  )
}
