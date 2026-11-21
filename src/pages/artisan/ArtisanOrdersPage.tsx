import { ChevronRightIcon, ReceiptTextIcon } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { SubOrderStatusBadge } from '@/components/common/StatusBadge'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useUpdateParams } from '@/features/catalog/useUpdateParams'
import { ARTISAN_ORDERS_PER_PAGE, useArtisanSubOrders } from '@/features/orders/api'
import { useProfile } from '@/hooks/useProfile'
import { formatDate, formatPrice } from '@/lib/format'
import { SUB_ORDER_STATUS_LABELS, type SubOrderStatus } from '@/lib/labels'

const STATUSES = Object.keys(SUB_ORDER_STATUS_LABELS) as SubOrderStatus[]

/** ART-6 — Sous-commandes de l'artisan, filtrables par statut. */
export default function ArtisanOrdersPage() {
  const [searchParams] = useSearchParams()
  const update = useUpdateParams()
  const { profile } = useProfile()
  const statusParam = searchParams.get('statut')
  const status = STATUSES.includes(statusParam as SubOrderStatus)
    ? (statusParam as SubOrderStatus)
    : null
  const pageParam = Number(searchParams.get('page') ?? '1')
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1
  const orders = useArtisanSubOrders(profile?.id, status, page)
  const total = orders.data?.total ?? 0

  return (
    <div>
      <PageHeader
        title="Commandes"
        description="Vos colis à préparer et expédier. Le client paie à la livraison."
      />

      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="orders-status" className="text-sm text-muted-foreground">
          Statut
        </label>
        <NativeSelect
          id="orders-status"
          className="w-56"
          value={status ?? ''}
          onChange={(event) => update({ statut: event.target.value })}
        >
          <NativeSelectOption value="">Tous les statuts</NativeSelectOption>
          {STATUSES.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {SUB_ORDER_STATUS_LABELS[value]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {orders.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : orders.isError ? (
        <ErrorState onRetry={() => void orders.refetch()} />
      ) : total === 0 ? (
        <EmptyState
          icon={ReceiptTextIcon}
          title={status ? 'Aucune commande avec ce statut' : 'Aucune commande pour l’instant'}
          description="Les commandes de vos clients apparaîtront ici."
        />
      ) : (
        <>
          {/* Mobile : cartes */}
          <ul className="space-y-3 md:hidden">
            {orders.data.subOrders.map((sub) => (
              <li key={sub.id}>
                <Link
                  to={`/artisan/commandes/${sub.id}`}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{sub.order?.order_number}</p>
                      <SubOrderStatusBadge status={sub.status} />
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {sub.order?.shipping_full_name} · {formatDate(sub.created_at)}
                    </p>
                    <p className="text-sm font-medium">{formatPrice(sub.total)}</p>
                  </div>
                  <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Tablette et ordinateur : tableau */}
          <div className="hidden rounded-xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Détail</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.data.subOrders.map((sub) => (
                  <TableRow key={sub.id} className="relative">
                    <TableCell className="font-medium">
                      <Link
                        to={`/artisan/commandes/${sub.id}`}
                        className="after:absolute after:inset-0 after:content-[''] hover:text-primary"
                      >
                        {sub.order?.order_number}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(sub.created_at)}</TableCell>
                    <TableCell>
                      {sub.order?.shipping_full_name}
                      <span className="block text-xs text-muted-foreground">
                        {sub.order?.shipping_city}
                      </span>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatPrice(sub.total)}
                    </TableCell>
                    <TableCell>
                      <SubOrderStatusBadge status={sub.status} />
                    </TableCell>
                    <TableCell>
                      <ChevronRightIcon
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Pagination page={page} pageCount={Math.ceil(total / ARTISAN_ORDERS_PER_PAGE)} />
    </div>
  )
}
