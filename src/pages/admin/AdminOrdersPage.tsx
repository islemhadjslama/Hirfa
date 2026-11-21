import { ReceiptTextIcon } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { AdminFilter, AdminToolbar } from '@/components/admin/AdminToolbar'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { SubOrderStatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ADMIN_PAGE_SIZE, useAdminArtisanOptions, useAdminSubOrders } from '@/features/admin/api'
import { pageFromParams } from '@/features/admin/params'
import { useUpdateParams } from '@/features/catalog/useUpdateParams'
import { formatDate, formatPrice } from '@/lib/format'
import { SUB_ORDER_STATUS_LABELS, type SubOrderStatus } from '@/lib/labels'

const STATUSES = Object.keys(SUB_ORDER_STATUS_LABELS) as SubOrderStatus[]
const isDate = (value: string | null) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))

/** ADM-6 — Toutes les sous-commandes : filtres par statut, artisan et période. */
export default function AdminOrdersPage() {
  const [params] = useSearchParams()
  const update = useUpdateParams()
  const statusParam = params.get('statut') as SubOrderStatus | null
  const status = statusParam && STATUSES.includes(statusParam) ? statusParam : null
  const artisanId = params.get('artisan')
  const from = isDate(params.get('du')) ? (params.get('du') as string) : ''
  const to = isDate(params.get('au')) ? (params.get('au') as string) : ''
  const page = pageFromParams(params)
  const artisans = useAdminArtisanOptions()
  const orders = useAdminSubOrders({ status, artisanId, from, to, page })
  const total = orders.data?.total ?? 0

  return (
    <div>
      <PageHeader
        title="Commandes"
        description={`${total} colis (une sous-commande par artisan et par commande)`}
      />
      <AdminToolbar>
        <AdminFilter
          id="orders-status"
          label="Statut"
          param="statut"
          value={status ?? ''}
          allLabel="Tous les statuts"
          options={STATUSES.map((value) => ({ value, label: SUB_ORDER_STATUS_LABELS[value] }))}
        />
        <AdminFilter
          id="orders-artisan"
          label="Artisan"
          param="artisan"
          value={artisanId ?? ''}
          allLabel="Tous les artisans"
          options={(artisans.data ?? []).map((a) => ({ value: a.id, label: a.shop_name }))}
        />
        <div className="flex items-center gap-2">
          <label htmlFor="orders-from" className="text-sm text-muted-foreground">
            Du
          </label>
          <Input
            id="orders-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => update({ du: event.target.value })}
            className="h-10 w-40"
          />
          <label htmlFor="orders-to" className="text-sm text-muted-foreground">
            au
          </label>
          <Input
            id="orders-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => update({ au: event.target.value })}
            className="h-10 w-40"
          />
        </div>
        {(status || artisanId || from || to) && (
          <Button variant="link" asChild>
            <Link to="/admin/commandes">Effacer les filtres</Link>
          </Button>
        )}
      </AdminToolbar>

      {orders.isPending ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : orders.isError ? (
        <ErrorState onRetry={() => void orders.refetch()} />
      ) : total === 0 ? (
        <EmptyState
          icon={ReceiptTextIcon}
          title="Aucune commande"
          description="Aucun colis ne correspond."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead className="hidden md:table-cell">Client</TableHead>
                <TableHead className="hidden md:table-cell">Artisan</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.data.rows.map((sub) => (
                <TableRow key={sub.id} className="relative">
                  <TableCell>
                    <Link
                      to={`/admin/commandes/${sub.order?.id}`}
                      className="font-medium after:absolute after:inset-0 after:content-[''] hover:text-primary"
                    >
                      {sub.order?.order_number}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(sub.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {sub.order?.shipping_full_name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{sub.artisan?.shop_name}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatPrice(sub.total)}
                  </TableCell>
                  <TableCell>
                    <SubOrderStatusBadge status={sub.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pagination page={page} pageCount={Math.ceil(total / ADMIN_PAGE_SIZE)} />
    </div>
  )
}
