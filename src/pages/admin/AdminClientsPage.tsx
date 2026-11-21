import { UsersIcon } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { AccountActiveToggle } from '@/components/admin/AccountActiveToggle'
import { AdminSearch, AdminToolbar } from '@/components/admin/AdminToolbar'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ADMIN_PAGE_SIZE, useAdminClients } from '@/features/admin/api'
import { pageFromParams } from '@/features/admin/params'
import { formatDate } from '@/lib/format'

/** ADM-3 — Clients : recherche, activation / désactivation. */
export default function AdminClientsPage() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const page = pageFromParams(params)
  const clients = useAdminClients({ q, page })
  const total = clients.data?.total ?? 0

  return (
    <div>
      <PageHeader title="Clients" description={`${total} compte${total > 1 ? 's' : ''} client`} />
      <AdminToolbar>
        <AdminSearch key={q} value={q} placeholder="Nom, email ou téléphone…" />
      </AdminToolbar>

      {clients.isPending ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : clients.isError ? (
        <ErrorState onRetry={() => void clients.refetch()} />
      ) : total === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="Aucun client"
          description="Aucun compte ne correspond."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                <TableHead className="hidden lg:table-cell">Ville</TableHead>
                <TableHead className="hidden lg:table-cell">Inscription</TableHead>
                <TableHead>Compte</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.data.rows.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link
                      to={`/admin/clients/${client.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {client.full_name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">{client.email}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{client.phone ?? '—'}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {[client.city, client.governorate].filter(Boolean).join(', ') || '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {formatDate(client.created_at)}
                  </TableCell>
                  <TableCell>
                    <AccountActiveToggle
                      userId={client.id}
                      name={client.full_name}
                      active={client.is_active}
                    />
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
