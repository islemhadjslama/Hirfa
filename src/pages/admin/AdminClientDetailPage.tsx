import { ArrowLeftIcon, UserXIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { AccountActiveToggle } from '@/components/admin/AccountActiveToggle'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageLoader } from '@/components/common/PageLoader'
import { SubOrderStatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminClient } from '@/features/admin/api'
import { formatDate, formatPrice } from '@/lib/format'

/** ADM-3 — Détail d'un client et de ses commandes. */
export default function AdminClientDetailPage() {
  const { id } = useParams()
  const client = useAdminClient(id)

  if (client.isPending) return <PageLoader />
  if (client.isError) return <ErrorState onRetry={() => void client.refetch()} />
  if (!client.data || client.data.role !== 'client') {
    return (
      <EmptyState
        icon={UserXIcon}
        title="Client introuvable"
        action={
          <Button variant="outline" asChild>
            <Link to="/admin/clients">Retour aux clients</Link>
          </Button>
        }
      />
    )
  }

  const c = client.data
  const address = [c.address, c.city, c.governorate].filter(Boolean).join(', ')

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link to="/admin/clients">
            <ArrowLeftIcon />
            Clients
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold sm:text-3xl">{c.full_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Client depuis le {formatDate(c.created_at)}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-6 text-sm">
          <p>{c.email}</p>
          <p>Tél. {c.phone ?? '—'}</p>
          <p>Adresse par défaut : {address || '—'}</p>
          <AccountActiveToggle userId={c.id} name={c.full_name} active={c.is_active} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">Commandes ({c.orders.length})</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {c.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune commande.</p>
          ) : (
            <ul className="divide-y text-sm">
              {c.orders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span>
                    <Link
                      to={`/admin/commandes/${order.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {order.order_number}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(order.created_at)} · {formatPrice(order.total)}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {order.sub_orders.map((sub) => (
                      <SubOrderStatusBadge key={sub.id} status={sub.status} />
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
