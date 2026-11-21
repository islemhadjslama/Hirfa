import { ArrowLeftIcon, Loader2Icon, PackageSearchIcon, PhoneIcon, XIcon } from 'lucide-react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { actorLabel } from '@/features/orders/actor'
import {
  ARTISAN_CANCELLABLE,
  NEXT_STATUS,
  NEXT_STATUS_ACTION,
  useSubOrder,
  useUpdateSubOrderStatus,
} from '@/features/orders/api'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime, formatPrice } from '@/lib/format'
import { SUB_ORDER_STATUS_LABELS } from '@/lib/labels'

/** ART-7 — Détail d'une sous-commande et transitions de statut. */
export default function ArtisanOrderDetailPage() {
  const { id } = useParams()
  const subOrderId = Number(id)
  const valid = Number.isInteger(subOrderId) && subOrderId > 0
  const sub = useSubOrder(valid ? subOrderId : null)
  const update = useUpdateSubOrderStatus()
  const [cancelOpen, setCancelOpen] = useState(false)

  if (valid && sub.isPending) return <PageLoader />
  if (sub.isError) return <ErrorState onRetry={() => void sub.refetch()} />
  if (!valid || !sub.data || !sub.data.order) {
    return (
      <EmptyState
        icon={PackageSearchIcon}
        title="Commande introuvable"
        description="Cette commande n’existe pas ou ne vous concerne pas."
        action={
          <Button variant="outline" asChild>
            <Link to="/artisan/commandes">Retour aux commandes</Link>
          </Button>
        }
      />
    )
  }

  const s = sub.data
  const order = s.order!
  const next = NEXT_STATUS[s.status]
  const canCancel = ARTISAN_CANCELLABLE.includes(s.status)

  function advance() {
    if (!next) return
    update.mutate(
      { subOrderId: s.id, status: next },
      {
        onSuccess: () => toast.success(`Commande passée à « ${SUB_ORDER_STATUS_LABELS[next]} ».`),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    )
  }

  function cancel(reason: string) {
    update.mutate(
      { subOrderId: s.id, status: 'cancelled', note: reason },
      {
        onSuccess: () => {
          toast.success('Commande annulée. Le stock a été restauré.')
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link to="/artisan/commandes">
            <ArrowLeftIcon />
            Commandes
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold sm:text-3xl">Commande {order.order_number}</h1>
          <SubOrderStatusBadge status={s.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Reçue le {formatDateTime(s.created_at)} · {formatPrice(s.total)} à encaisser à la
          livraison
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <StatusProgress status={s.status} />
          {s.status === 'cancelled' && s.cancel_reason && (
            <p className="text-sm text-muted-foreground">Motif d’annulation : {s.cancel_reason}</p>
          )}
          {(next || canCancel) && (
            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              {canCancel && (
                <Button
                  variant="outline"
                  className="text-destructive"
                  disabled={update.isPending}
                  onClick={() => setCancelOpen(true)}
                >
                  <XIcon />
                  Annuler la commande
                </Button>
              )}
              {next && (
                <Button disabled={update.isPending} onClick={advance}>
                  {update.isPending && <Loader2Icon className="animate-spin" />}
                  {NEXT_STATUS_ACTION[s.status]}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="text-lg font-semibold">Articles</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {s.order_items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span>
                      <span className="font-semibold">{item.quantity} ×</span> {item.product_name}
                      <span className="block text-xs text-muted-foreground">
                        {formatPrice(item.unit_price)} l’unité
                      </span>
                    </span>
                    <span className="shrink-0">{formatPrice(item.line_total)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1 border-t pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Sous-total</dt>
                  <dd>{formatPrice(s.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Livraison</dt>
                  <dd>{formatPrice(s.shipping_fee)}</dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>Total à encaisser</dt>
                  <dd className="text-primary">{formatPrice(s.total)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="text-lg font-semibold">Historique</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusHistory
                entries={s.sub_order_status_history.map((entry) => ({
                  ...entry,
                  actor: actorLabel(
                    entry.changed_by,
                    {
                      clientId: order.client_id,
                      artisanId: s.artisan_id,
                      artisanName: s.artisan?.shop_name ?? '',
                    },
                    'artisan',
                  ),
                }))}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">Livraison</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{order.shipping_full_name}</p>
            <p>{order.shipping_address}</p>
            <p>
              {order.shipping_city}, {order.shipping_governorate}
            </p>
            <a
              href={`tel:+216${order.shipping_phone}`}
              className="inline-flex items-center gap-1.5 pt-1 font-medium text-sidi-bou hover:underline"
            >
              <PhoneIcon className="size-4" aria-hidden="true" />
              {order.shipping_phone}
            </a>
            {order.notes && (
              <p className="mt-3 rounded-lg bg-muted px-3 py-2">
                <span className="font-medium">Note du client :</span> {order.notes}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <CancelSubOrderDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        reasonRequired
        pending={update.isPending}
        onConfirm={cancel}
        description="Le client sera informé du motif dans le suivi de sa commande. Le stock des articles sera restauré."
      />
    </div>
  )
}
