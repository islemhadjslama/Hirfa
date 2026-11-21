import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { Skeleton } from '@/components/ui/skeleton'

type StatCardProps = {
  label: string
  value: ReactNode
  icon: LucideIcon
  detail?: ReactNode
  to?: string
  loading?: boolean
}

/** Indicateur chiffré (tuile) des tableaux de bord. */
export function StatCard({ label, value, icon: Icon, detail, to, loading }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <p className="mt-1 font-heading text-3xl font-semibold tracking-tight">{value}</p>
      )}
      {detail && !loading && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}
    </>
  )
  const className = 'block rounded-2xl border bg-card p-4'
  return to ? (
    <Link to={to} className={`${className} transition hover:border-primary/40 hover:shadow-sm`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}
