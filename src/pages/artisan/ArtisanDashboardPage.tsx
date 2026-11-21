import { BanknoteIcon, ClockIcon, PackageIcon, PlusIcon, StarIcon, TrophyIcon } from 'lucide-react'
import { Link } from 'react-router'

import { MonthlyBarChart } from '@/components/admin/MonthlyBarChart'
import { StatCard } from '@/components/admin/StatCard'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { SubOrderStatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useArtisanStats } from '@/features/artisan/api'
import { firstName } from '@/features/auth/account-links'
import { useProfile } from '@/hooks/useProfile'
import { formatDate, formatPrice } from '@/lib/format'

const ratingFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })
/** Axe du graphique : « 1 250 DT » (sans millimes). */
const axisPrice = (value: number) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} DT`

/** ART-8 — Tableau de bord de l'artisan. */
export default function ArtisanDashboardPage() {
  const { profile } = useProfile()
  const stats = useArtisanStats(Boolean(profile))
  const s = stats.data

  if (stats.isError) return <ErrorState onRetry={() => void stats.refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={profile ? `Bonjour ${firstName(profile)}` : 'Tableau de bord'}
        description={profile?.artisan_profiles?.shop_name}
        actions={
          <Button asChild>
            <Link to="/artisan/produits/nouveau">
              <PlusIcon />
              Nouveau produit
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Chiffre d’affaires"
          icon={BanknoteIcon}
          loading={!s}
          value={s && formatPrice(s.revenue)}
          detail="Commandes livrées, livraison incluse"
        />
        <StatCard
          label="Commandes en attente"
          icon={ClockIcon}
          loading={!s}
          value={s?.pending_orders}
          to="/artisan/commandes?statut=pending"
          detail={s && s.pending_orders > 0 ? 'À confirmer' : 'Rien à traiter'}
        />
        <StatCard
          label="Produits publiés"
          icon={PackageIcon}
          loading={!s}
          value={s?.published_products}
          to="/artisan/produits"
        />
        <StatCard
          label="Note moyenne"
          icon={StarIcon}
          loading={!s}
          value={s && (s.avg_rating === null ? '—' : `${ratingFormatter.format(s.avg_rating)}/5`)}
          to="/artisan/avis"
          detail={s && `${s.reviews_count} avis`}
        />
      </div>

      <section className="rounded-2xl border bg-card p-4">
        {s ? (
          <MonthlyBarChart
            title="Ventes livrées par mois (6 derniers mois)"
            unit="Chiffre d’affaires"
            format={formatPrice}
            axisFormat={axisPrice}
            data={s.sales_by_month.map((m) => ({ month: m.month, value: Number(m.revenue) }))}
          />
        ) : (
          <Skeleton className="h-64 w-full" />
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section aria-labelledby="top-produits" className="rounded-2xl border bg-card p-4">
          <h2
            id="top-produits"
            className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold tracking-normal"
          >
            <TrophyIcon className="size-4 text-amber-600" aria-hidden="true" />
            Meilleures ventes
          </h2>
          {!s ? (
            <Skeleton className="h-40 w-full" />
          ) : s.top_products.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Vos meilleures ventes apparaîtront ici.
            </p>
          ) : (
            <ol className="divide-y text-sm">
              {s.top_products.map((product, index) => (
                <li
                  key={product.product_id ?? `supprime-${index}`}
                  className="flex items-center gap-3 py-2"
                >
                  <span className="w-5 text-center font-heading font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{product.name}</span>
                  <span className="text-muted-foreground">{product.quantity} vendu(s)</span>
                  <span className="w-24 text-right font-medium">
                    {formatPrice(product.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="dernieres-commandes" className="rounded-2xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2
              id="dernieres-commandes"
              className="font-sans text-sm font-semibold tracking-normal"
            >
              Dernières commandes
            </h2>
            <Button variant="link" size="sm" asChild>
              <Link to="/artisan/commandes">Tout voir</Link>
            </Button>
          </div>
          {!s ? (
            <Skeleton className="h-40 w-full" />
          ) : s.recent_orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucune commande pour l’instant.
            </p>
          ) : (
            <ul className="divide-y text-sm">
              {s.recent_orders.map((order) => (
                <li key={order.id}>
                  <Link
                    to={`/artisan/commandes/${order.id}`}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 hover:text-primary"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{order.order_number}</span>
                      <span className="block text-xs text-muted-foreground">
                        {order.client_name} · {formatDate(order.created_at)}
                      </span>
                    </span>
                    <span className="font-medium">{formatPrice(order.total)}</span>
                    <SubOrderStatusBadge status={order.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
