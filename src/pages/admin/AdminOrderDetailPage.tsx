import { ArrowLeftIcon, Loader2Icon, PackageSearchIcon, StoreIcon } from 'lucide-react'
import { useId, useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageLoader } from '@/components/common/PageLoader'
import { SubOrderStatusBadge } from '@/components/common/StatusBadge'
import { StatusHistory, StatusProgress } from '@/components/orders/OrderTimeline'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { actorLabel } from '@/features/orders/actor'
import { useOrder, useUpdateSubOrderStatus, type OrderSubOrder } from '@/features/orders/api'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime, formatPrice } from '@/lib/format'
import { SUB_ORDER_STATUS_LABELS, type SubOrderStatus } from '@/lib/labels'

const STATUSES = Object.keys(SUB_ORDER_STATUS_LABELS) as SubOrderStatus[]
const FINAL: SubOrderStatus[] = ['delivered', 'cancelled']

/** Changement de statut par l'admin : toute transition depuis un statut non final (RM-6). */
function AdminStatusControl({ sub }: { sub: OrderSubOrder }) {
  const selectId = useId()
  const update = useUpdateSubOrderStatus()
  const [target, setTarget] = useState<SubOrderStatus | ''>('')
  const [confirmCancel, setConfirmCancel] = useState(false)

  if (FINAL.includes(sub.status)) {
    return (
      <p className="text-sm text-muted-foreground">Statut final : il ne peut plus être modifié.</p>
    )
  }

  function apply(status: SubOrderStatus, note?: string) {
    update.mutate(
      { subOrderId: sub.id, status, note },
      {
        onSuccess: () => {
          toast.success(`Statut changé en « ${SUB_ORDER_STATUS_LABELS[status]} ».`)
          setTarget('')
          setConfirmCancel(false)
        },
        onError: (error) => {
          toast.error(getErrorMessage(error))
          setConfirmCancel(false)
        },
      },
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={selectId} className="text-sm text-muted-foreground">
        Changer le statut
      </label>
      <NativeSelect
        id={selectId}
        className="w-48"
        value={target}
        onChange={(event) => setTarget(event.target.value as SubOrderStatus | '')}
      >
        <NativeSelectOption value="">Choisir…</NativeSelectOption>
        {STATUSES.filter((status) => status !== sub.status).map((status) => (
          <NativeSelectOption key={status} value={status}>
            {SUB_ORDER_STATUS_LABELS[status]}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <Button
        disabled={!target || update.isPending}
        variant={target === 'cancelled' ? 'destructive' : 'default'}
        onClick={() => (target === 'cancelled' ? setConfirmCancel(true) : target && apply(target))}
      >
        {update.isPending && <Loader2Icon className="animate-spin" />}
        Appliquer
      </Button>
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Annuler ce colis ?"
        description="Le stock des articles sera restauré. Le client et l’artisan verront le motif dans l’historique."
        reasonLabel="Motif d’annulation"
        confirmLabel="Annuler le colis"
        destructive
        pending={update.isPending}
        onConfirm={(reason) => apply('cancelled', reason)}
      />
    </div>
  )
}

/** ADM-6 — Détail d'une commande, avec changement de statut de chaque sous-commande. */
export default function AdminOrderDetailPage() {
  const { id } = useParams()
  const orderId = Number(id)
  const valid = Number.isInteger(orderId) && orderId > 0
  const order = useOrder(valid ? orderId : null)

  if (valid && order.isPending) return <PageLoader />
  if (order.isError) return <ErrorState onRetry={() => void order.refetch()} />
  if (!valid || !order.data) {
    return (
      <EmptyState
        icon={PackageSearchIcon}
        title="Commande introuvable"
        action={
          <Button variant="outline" asChild>
            <Link to="/admin/commandes">Retour aux commandes</Link>
          </Button>
        }
      />
    )
  }

  const o = order.data
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link to="/admin/commandes">
            <ArrowLeftIcon />
            Commandes
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold sm:text-3xl">Commande {o.order_number}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Passée le {formatDateTime(o.created_at)} par{' '}
          <Link to={`/admin/clients/${o.client_id}`} className="text-sidi-bou hover:underline">
            {o.shipping_full_name}
          </Link>{' '}
          · Total {formatPrice(o.total)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-4">
          {o.sub_orders.map((sub) => (
            <article key={sub.id} className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-sans text-base font-semibold tracking-normal">
                  <StoreIcon className="size-4 text-olive" aria-hidden="true" />
                  <Link to={`/admin/artisans/${sub.artisan_id}`} className="hover:text-primary">
                    {sub.artisan?.shop_name}
                  </Link>
                </h2>
                <SubOrderStatusBadge status={sub.status} />
              </header>
              <StatusProgress status={sub.status} />
              {sub.status === 'cancelled' && sub.cancel_reason && (
                <p className="text-sm text-muted-foreground">Motif : {sub.cancel_reason}</p>
              )}
              <AdminStatusControl sub={sub} />
              <ul className="space-y-1 border-t pt-3 text-sm">
                {sub.order_items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-2">
                    <span>
                      {item.quantity} × {item.product_name}
                    </span>
                    <span>{formatPrice(item.line_total)}</span>
                  </li>
                ))}
                <li className="flex justify-between gap-2 text-muted-foreground">
                  <span>Livraison</span>
                  <span>{formatPrice(sub.shipping_fee)}</span>
                </li>
                <li className="flex justify-between gap-2 border-t pt-1 font-semibold">
                  <span>Total du colis</span>
                  <span>{formatPrice(sub.total)}</span>
                </li>
              </ul>
              <details className="rounded-xl bg-muted/50 px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium">Historique</summary>
                <div className="mt-3">
                  <StatusHistory
                    entries={sub.sub_order_status_history.map((entry) => ({
                      ...entry,
                      actor: actorLabel(
                        entry.changed_by,
                        {
                          clientId: o.client_id,
                          artisanId: sub.artisan_id,
                          artisanName: sub.artisan?.shop_name ?? 'l’artisan',
                        },
                        'admin',
                      ),
                    }))}
                  />
                </div>
              </details>
            </article>
          ))}
        </div>
        <aside className="h-fit space-y-1 rounded-2xl border bg-card p-4 text-sm">
          <h2 className="mb-1 font-sans text-sm font-semibold tracking-normal">Livraison</h2>
          <p className="font-medium">{o.shipping_full_name}</p>
          <p>{o.shipping_address}</p>
          <p>
            {o.shipping_city}, {o.shipping_governorate}
          </p>
          <p>Tél. {o.shipping_phone}</p>
          {o.notes && <p className="pt-2 text-muted-foreground">Note : {o.notes}</p>}
        </aside>
      </div>
    </div>
  )
}
