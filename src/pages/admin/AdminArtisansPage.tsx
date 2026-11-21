import { HammerIcon } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { ArtisanStatusActions } from '@/components/admin/ArtisanStatusActions'
import { AdminFilter, AdminSearch, AdminToolbar } from '@/components/admin/AdminToolbar'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { AccountStatusBadge, ArtisanStatusBadge } from '@/components/common/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ADMIN_PAGE_SIZE, useAdminArtisans } from '@/features/admin/api'
import { pageFromParams } from '@/features/admin/params'
import { formatDate } from '@/lib/format'
import { ARTISAN_STATUS_LABELS, type ArtisanStatus } from '@/lib/labels'

const STATUSES = Object.keys(ARTISAN_STATUS_LABELS) as ArtisanStatus[]

/** ADM-2 — Artisans filtrables par statut, avec actions rapides. */
export default function AdminArtisansPage() {
  const [params] = useSearchParams()
  const statusParam = params.get('statut') as ArtisanStatus | null
  const status = statusParam && STATUSES.includes(statusParam) ? statusParam : null
  const q = params.get('q') ?? ''
  const page = pageFromParams(params)
  const artisans = useAdminArtisans({ status, q, page })
  const total = artisans.data?.total ?? 0

  return (
    <div>
      <PageHeader title="Artisans" description={`${total} boutique${total > 1 ? 's' : ''}`} />
      <AdminToolbar>
        <AdminSearch key={q} value={q} placeholder="Rechercher une boutique…" />
        <AdminFilter
          id="artisans-status"
          label="Statut"
          param="statut"
          value={status ?? ''}
          allLabel="Tous les statuts"
          options={STATUSES.map((value) => ({ value, label: ARTISAN_STATUS_LABELS[value] }))}
        />
      </AdminToolbar>

      {artisans.isPending ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : artisans.isError ? (
        <ErrorState onRetry={() => void artisans.refetch()} />
      ) : total === 0 ? (
        <EmptyState
          icon={HammerIcon}
          title="Aucun artisan"
          description="Aucune boutique ne correspond."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Boutique</TableHead>
                <TableHead className="hidden md:table-cell">Artisan</TableHead>
                <TableHead className="hidden lg:table-cell">Gouvernorat</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden lg:table-cell">Inscription</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {artisans.data.rows.map((artisan) => (
                <TableRow key={artisan.id}>
                  <TableCell>
                    <Link
                      to={`/admin/artisans/${artisan.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {artisan.shop_name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {artisan.specialty?.name ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {artisan.profile?.full_name}
                    <span className="block text-xs text-muted-foreground">
                      {artisan.profile?.email}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {artisan.governorate ?? '—'}
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-col items-start gap-1">
                      <ArtisanStatusBadge status={artisan.status} />
                      {artisan.profile && !artisan.profile.is_active && (
                        <AccountStatusBadge active={false} />
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {formatDate(artisan.created_at)}
                  </TableCell>
                  <TableCell>
                    <ArtisanStatusActions
                      artisanId={artisan.id}
                      shopName={artisan.shop_name}
                      status={artisan.status}
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
