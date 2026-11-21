import { BanknoteIcon, HammerIcon, PackageIcon, ReceiptTextIcon, UsersIcon } from 'lucide-react'
import { Link } from 'react-router'

import { ArtisanStatusActions } from '@/components/admin/ArtisanStatusActions'
import { MonthlyBarChart } from '@/components/admin/MonthlyBarChart'
import { StatCard } from '@/components/admin/StatCard'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminStats } from '@/features/admin/api'
import { formatDate, formatPrice } from '@/lib/format'

const numberFormatter = new Intl.NumberFormat('fr-FR')

/** ADM-1 — Indicateurs, commandes des 6 derniers mois, artisans en attente. */
export default function AdminDashboardPage() {
  const stats = useAdminStats()
  const s = stats.data

  if (stats.isError) return <ErrorState onRetry={() => void stats.refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord" description="Vue d’ensemble de la marketplace." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="Clients"
          icon={UsersIcon}
          loading={!s}
          value={s && numberFormatter.format(s.clients)}
          to="/admin/clients"
        />
        <StatCard
          label="Artisans"
          icon={HammerIcon}
          loading={!s}
          value={s && numberFormatter.format(s.artisans.total)}
          to="/admin/artisans"
          detail={
            s && (
              <>
                {s.artisans.approved} approuvés · {s.artisans.pending} en attente
                <br />
                {s.artisans.rejected} refusés · {s.artisans.suspended} suspendus
              </>
            )
          }
        />
        <StatCard
          label="Produits"
          icon={PackageIcon}
          loading={!s}
          value={s && numberFormatter.format(s.products)}
          to="/admin/produits"
        />
        <StatCard
          label="Commandes"
          icon={ReceiptTextIcon}
          loading={!s}
          value={s && numberFormatter.format(s.orders)}
          to="/admin/commandes"
        />
        <StatCard
          label="Chiffre d’affaires livré"
          icon={BanknoteIcon}
          loading={!s}
          value={s && formatPrice(s.revenue)}
          detail="Sous-commandes livrées, livraison incluse"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_24rem]">
        <section className="min-w-0 rounded-2xl border bg-card p-4">
          {s ? (
            <MonthlyBarChart
              title="Commandes par mois (6 derniers mois)"
              unit="Commandes"
              data={s.orders_by_month.map((m) => ({ month: m.month, value: m.orders }))}
            />
          ) : (
            <Skeleton className="h-64 w-full" />
          )}
        </section>

        <section className="rounded-2xl border bg-card p-4" aria-labelledby="artisans-attente">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="artisans-attente" className="font-sans text-sm font-semibold tracking-normal">
              Artisans en attente de validation
            </h2>
            <Button variant="link" size="sm" asChild>
              <Link to="/admin/artisans?statut=pending">Tout voir</Link>
            </Button>
          </div>
          {!s ? (
            <Skeleton className="h-32 w-full" />
          ) : s.pending_artisans.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucune boutique en attente.
            </p>
          ) : (
            <ul className="divide-y">
              {s.pending_artisans.map((artisan) => (
                <li key={artisan.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
                  <div>
                    <Link
                      to={`/admin/artisans/${artisan.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {artisan.shop_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {artisan.full_name} · {artisan.governorate ?? 'Gouvernorat non précisé'} ·
                      inscrit le {formatDate(artisan.created_at)}
                    </p>
                  </div>
                  <ArtisanStatusActions
                    artisanId={artisan.id}
                    shopName={artisan.shop_name}
                    status="pending"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
