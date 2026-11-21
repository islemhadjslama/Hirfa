import { ArrowLeftIcon, PackageSearchIcon, StoreIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageLoader } from '@/components/common/PageLoader'
import { SubOrderStatusBadge } from '@/components/common/StatusBadge'
import { CancelSubOrderDialog } from '@/components/orders/CancelSubOrderDialog'
import { StatusHistory, StatusProgress } from '@/components/orders/OrderTimeline'
import { Button } from '@/components/ui/button'
import { actorLabel } from '@/features/orders/actor'
import { useOrder, useUpdateSubOrderStatus, type OrderSubOrder } from '@/features/orders/api'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime, formatPrice } from '@/lib/format'

function SubOrderCard({ sub, clientId }: { sub: OrderSubOrder; clientId: string }) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const update = useUpdateSubOrderStatus()
  const artisanName = sub.artisan?.shop_name ?? 'l’artisan'

  function cancel(reason: string) {
    update.mutate(
      { subOrderId: sub.id, status: 'cancelled', note: reason },
      {
        onSuccess: () => {
          toast.success(`Votre commande auprès de ${artisanName} a été annulée.`)
          setCancelOpen(false)
        },
        onError: (error) => {
          toast.error(getErrorMessage(error))
          setCancelOpen(false)
        },
      },
    )
  }

  return (
    <article className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-sans text-base font-semibold tracking-normal">
          <StoreIcon className="size-4 text-olive" aria-hidden="true" />
          {sub.artisan ? (
            <Link to={`/artisans/${sub.artisan.slug}`} className="hover:text-primary">
              {artisanName}
            </Link>
          ) : (
            artisanName
          )}
        </h2>
        <SubOrderStatusBadge status={sub.status} />
      </header>

      <StatusProgress status={sub.status} />
      {sub.status === 'cancelled' && sub.cancel_reason && (
        <p className="text-sm text-muted-foreground">Motif d’annulation : {sub.cancel_reason}</p>
      )}

      <ul className="space-y-1 border-t pt-3 text-sm">
        {sub.order_items.map((item) => (
          <li key={item.id} className="flex justify-between gap-2">
            <span>
              {item.quantity} × {item.product_name}{' '}
              <span className="text-muted-foreground">({formatPrice(item.unit_price)})</span>
            </span>
            <span className="shrink-0">{formatPrice(item.line_total)}</span>
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

      <details className="group rounded-xl bg-muted/50 px-3 py-2" open>
        <summary className="cursor-pointer text-sm font-medium">Historique</summary>
        <div className="mt-3">
          <StatusHistory
            entries={sub.sub_order_status_history.map((entry) => ({
              ...entry,
              actor: actorLabel(
                entry.changed_by,
                { clientId, artisanId: sub.artisan_id, artisanName },
                'client',
              ),
            }))}
          />
        </div>
      </details>

      {/* CLI-4 : annulation possible tant que la sous-commande est « En attente » */}
      {sub.status === 'pending' && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => setCancelOpen(true)}
          >
            <XIcon />
            Annuler ce colis
          </Button>
        </div>
      )}

      <CancelSubOrderDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        reasonRequired={false}
        pending={update.isPending}
        onConfirm={cancel}
        description={`Le colis de ${artisanName} (${formatPrice(sub.total)}) sera annulé. Les autres colis de la commande ne sont pas concernés.`}
      />
    </article>
  )
}

/** CLI-3 / CLI-4 — Détail d'une commande, par sous-commande, avec historique. */
export default function ClientOrderDetailPage() {
  const { id } = useParams()
  const orderId = Number(id)
  const valid = Number.isInteger(orderId) && orderId > 0
  const order = useOrder(valid ? orderId : null)

  if (valid && order.isPending) return <PageLoader />
  if (order.isError) return <ErrorState onRetry={() => void order.refetch()} />
  if (!valid || !order.data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState
          icon={PackageSearchIcon}
          title="Commande introuvable"
          description="Cette commande n’existe pas ou ne vous appartient pas."
          action={
            <Button asChild>
              <Link to="/compte/commandes">Mes commandes</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const o = order.data
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link to="/compte/commandes">
            <ArrowLeftIcon />
            Mes commandes
          </Link>
        </Button>
        <h1 className="text-3xl font-semibold">Commande {o.order_number}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Passée le {formatDateTime(o.created_at)} · Total {formatPrice(o.total)} · Paiement à la
          livraison
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-4">
          {o.sub_orders.map((sub) => (
            <SubOrderCard key={sub.id} sub={sub} clientId={o.client_id} />
          ))}
        </div>
        <aside className="h-fit space-y-4 rounded-2xl border bg-card p-4 text-sm">
          <section>
            <h2 className="mb-1 font-sans text-sm font-semibold tracking-normal">Livraison</h2>
            <p className="font-medium">{o.shipping_full_name}</p>
            <p>{o.shipping_address}</p>
            <p>
              {o.shipping_city}, {o.shipping_governorate}
            </p>
            <p>Tél. {o.shipping_phone}</p>
            {o.notes && <p className="mt-2 text-muted-foreground">Note : {o.notes}</p>}
          </section>
          <dl className="space-y-1 border-t pt-3">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Sous-total</dt>
              <dd>{formatPrice(o.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Livraison</dt>
              <dd>{formatPrice(o.shipping_total)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd className="text-primary">{formatPrice(o.total)}</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Les colis annulés ne sont pas à payer : réglez uniquement les colis livrés.
          </p>
        </aside>
      </div>
    </div>
  )
}
