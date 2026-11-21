import { CircleCheckIcon, PackageSearchIcon, StoreIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageLoader } from '@/components/common/PageLoader'
import { Button } from '@/components/ui/button'
import { useOrder } from '@/features/orders/api'
import { formatDateTime, formatPrice } from '@/lib/format'

const NEXT_STEPS = [
  'Chaque artisan reçoit votre commande et la confirme.',
  'Il prépare votre colis puis l’expédie à l’adresse indiquée.',
  'Vous réglez chaque colis en espèces à sa réception.',
]

/** PAN-6 — Confirmation de commande. */
export default function OrderConfirmationPage() {
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
              <Link to="/catalogue">Retour au catalogue</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const o = order.data
  const address = [o.shipping_address, o.shipping_city, o.shipping_governorate].join(', ')

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <CircleCheckIcon className="size-14 text-olive" aria-hidden="true" />
        <h1 className="text-3xl font-semibold">Merci pour votre commande !</h1>
        <p className="text-muted-foreground">
          Commande <strong className="text-foreground">{o.order_number}</strong> passée le{' '}
          {formatDateTime(o.created_at)}
        </p>
      </div>

      <section aria-labelledby="etapes" className="rounded-2xl border bg-card p-5">
        <h2 id="etapes" className="mb-3 font-sans text-base font-semibold tracking-normal">
          Prochaines étapes
        </h2>
        <ol className="list-inside list-decimal space-y-1 text-sm">
          {NEXT_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="resume" className="space-y-4">
        <h2 id="resume" className="text-xl font-semibold">
          Résumé ({o.sub_orders.length} colis)
        </h2>
        {o.sub_orders.map((sub) => (
          <article key={sub.id} className="rounded-2xl border bg-card">
            <header className="flex items-center gap-2 border-b px-4 py-3 text-sm">
              <StoreIcon className="size-4 text-olive" aria-hidden="true" />
              <span>
                Colis préparé par <strong>{sub.artisan?.shop_name ?? 'l’artisan'}</strong>
              </span>
            </header>
            <ul className="space-y-1 px-4 py-3 text-sm">
              {sub.order_items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span>
                    {item.quantity} × {item.product_name}
                  </span>
                  <span className="shrink-0">{formatPrice(item.line_total)}</span>
                </li>
              ))}
              <li className="flex justify-between gap-2 text-muted-foreground">
                <span>Livraison</span>
                <span>{formatPrice(sub.shipping_fee)}</span>
              </li>
            </ul>
            <p className="flex justify-between border-t px-4 py-2 text-sm font-semibold">
              <span>Total du colis</span>
              <span>{formatPrice(sub.total)}</span>
            </p>
          </article>
        ))}
        <dl className="space-y-1 rounded-2xl border bg-card p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Sous-total</dt>
            <dd>{formatPrice(o.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Livraison</dt>
            <dd>{formatPrice(o.shipping_total)}</dd>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <dt>Total à payer à la livraison</dt>
            <dd className="text-primary">{formatPrice(o.total)}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="livraison" className="rounded-2xl border bg-card p-5 text-sm">
        <h2 id="livraison" className="mb-2 font-sans text-base font-semibold tracking-normal">
          Livraison
        </h2>
        <p className="font-medium">{o.shipping_full_name}</p>
        <p>{address}</p>
        <p>Tél. {o.shipping_phone}</p>
        {o.notes && <p className="mt-2 text-muted-foreground">Note : {o.notes}</p>}
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link to={`/compte/commandes/${o.id}`}>Suivre ma commande</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/catalogue">Continuer mes achats</Link>
        </Button>
      </div>
    </div>
  )
}
