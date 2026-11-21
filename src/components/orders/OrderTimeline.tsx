import {
  CheckIcon,
  CircleDotIcon,
  PackageCheckIcon,
  PackageIcon,
  TruckIcon,
  XCircleIcon,
  type LucideIcon,
} from 'lucide-react'

import { formatDateTime } from '@/lib/format'
import { SUB_ORDER_STATUS_LABELS, type SubOrderStatus } from '@/lib/labels'
import { cn } from '@/lib/utils'

const FLOW: { status: SubOrderStatus; icon: LucideIcon }[] = [
  { status: 'pending', icon: CircleDotIcon },
  { status: 'confirmed', icon: CheckIcon },
  { status: 'preparing', icon: PackageIcon },
  { status: 'shipped', icon: TruckIcon },
  { status: 'delivered', icon: PackageCheckIcon },
]

/** Barre de progression du cycle pending → delivered (ou « Annulée »). */
export function StatusProgress({ status }: { status: SubOrderStatus }) {
  if (status === 'cancelled') {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
        <XCircleIcon className="size-4" aria-hidden="true" />
        Commande annulée
      </p>
    )
  }
  const current = FLOW.findIndex((step) => step.status === status)
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Avancement de la commande">
      {FLOW.map((step, index) => {
        const done = index <= current
        const Icon = step.icon
        return (
          <li
            key={step.status}
            className="flex flex-col items-center gap-1 text-center"
            aria-current={index === current ? 'step' : undefined}
          >
            <span
              className={cn(
                'flex size-8 items-center justify-center rounded-full border-2',
                done
                  ? 'border-olive bg-olive text-white'
                  : 'border-border bg-card text-muted-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span
              className={cn(
                'text-[11px] leading-tight sm:text-xs',
                index === current ? 'font-semibold' : 'text-muted-foreground',
              )}
            >
              {SUB_ORDER_STATUS_LABELS[step.status]}
              <span className="sr-only">{done ? ' (fait)' : ' (à venir)'}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export type TimelineEntry = {
  id: number
  status: SubOrderStatus
  note: string | null
  created_at: string
  /** Libellé de l'auteur du changement (« Vous », nom de la boutique, « Administration »). */
  actor?: string
}

/** CLI-3 — Historique des statuts, du plus ancien au plus récent. */
export function StatusHistory({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-border pl-5">
      {entries.map((entry, index) => {
        const last = index === entries.length - 1
        return (
          <li key={entry.id} className="relative">
            <span
              className={cn(
                'absolute top-1 -left-[27px] size-3 rounded-full border-2 border-card',
                entry.status === 'cancelled' ? 'bg-destructive' : last ? 'bg-primary' : 'bg-olive',
              )}
              aria-hidden="true"
            />
            <p className="text-sm font-medium">{SUB_ORDER_STATUS_LABELS[entry.status]}</p>
            <p className="text-xs text-muted-foreground">
              <time dateTime={entry.created_at}>{formatDateTime(entry.created_at)}</time>
              {entry.actor && ` · ${entry.actor}`}
            </p>
            {entry.note && (
              <p className="mt-1 rounded-lg bg-muted px-2 py-1 text-sm">{entry.note}</p>
            )}
          </li>
        )
      })}
    </ol>
  )
}
