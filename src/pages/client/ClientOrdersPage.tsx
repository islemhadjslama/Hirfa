import { ChevronRightIcon, PackageIcon } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Pagination } from '@/components/common/Pagination'
import { SubOrderStatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CLIENT_ORDERS_PER_PAGE, useClientOrders } from '@/features/orders/api'
import { useProfile } from '@/hooks/useProfile'
import { formatDate, formatPrice } from '@/lib/format'

/** CLI-2 — Mes commandes : numéro, date, total, statut de chaque sous-commande. */
export default function ClientOrdersPage() {
  const [searchParams] = useSearchParams()
  const pageParam = Number(searchParams.get('page') ?? '1')
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1
  const { profile } = useProfile()
  const orders = useClientOrders(profile?.id, page)
  const total = orders.data?.total ?? 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">Mes commandes</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Chaque commande est découpée en un colis par artisan, avec son propre suivi.
      </p>

      {orders.isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : orders.isError ? (
        <ErrorState onRetry={() => void orders.refetch()} />
      ) : total === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title="Aucune commande pour l’instant"
          description="Vos commandes apparaîtront ici, avec leur suivi."
          action={
            <Button asChild>
              <Link to="/catalogue">Découvrir le catalogue</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {orders.data.orders.map((order) => (
            <li key={order.id}>
              <Link
                to={`/compte/commandes/${order.id}`}
                className="group flex items-center gap-3 rounded-2xl border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-semibold">{order.order_number}</p>
                    <p className="font-semibold text-primary">{formatPrice(order.total)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Passée le {formatDate(order.created_at)} · {order.sub_orders.length} colis
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {order.sub_orders.map((sub) => (
                      <li key={sub.id} className="flex items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground">{sub.artisan?.shop_name} :</span>
                        <SubOrderStatusBadge status={sub.status} />
                      </li>
                    ))}
                  </ul>
                </div>
                <ChevronRightIcon
                  className="size-5 shrink-0 text-muted-foreground transition group-hover:text-primary"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} pageCount={Math.ceil(total / CLIENT_ORDERS_PER_PAGE)} />
    </div>
  )
}
