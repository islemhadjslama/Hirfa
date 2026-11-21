import { ArrowLeftIcon, ExternalLinkIcon, StoreIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { AccountActiveToggle } from '@/components/admin/AccountActiveToggle'
import { ArtisanStatusActions } from '@/components/admin/ArtisanStatusActions'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageLoader } from '@/components/common/PageLoader'
import {
  ArtisanStatusBadge,
  ProductStatusBadge,
  SubOrderStatusBadge,
} from '@/components/common/StatusBadge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminArtisan, useAdminProducts, useAdminSubOrders } from '@/features/admin/api'
import { formatDate, formatPrice } from '@/lib/format'

/** ADM-2 — Détail d'un artisan : boutique, compte, produits et commandes. */
export default function AdminArtisanDetailPage() {
  const { id } = useParams()
  const artisan = useAdminArtisan(id)
  const products = useAdminProducts({
    q: '',
    artisanId: id ?? null,
    categoryId: null,
    status: null,
    page: 1,
  })
  const orders = useAdminSubOrders({
    status: null,
    artisanId: id ?? null,
    from: '',
    to: '',
    page: 1,
  })

  if (artisan.isPending) return <PageLoader />
  if (artisan.isError) return <ErrorState onRetry={() => void artisan.refetch()} />
  if (!artisan.data) {
    return (
      <EmptyState
        icon={StoreIcon}
        title="Artisan introuvable"
        action={
          <Button variant="outline" asChild>
            <Link to="/admin/artisans">Retour aux artisans</Link>
          </Button>
        }
      />
    )
  }

  const a = artisan.data
  const place = [a.city, a.governorate].filter(Boolean).join(', ')

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link to="/admin/artisans">
            <ArrowLeftIcon />
            Artisans
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold sm:text-3xl">{a.shop_name}</h1>
          <ArtisanStatusBadge status={a.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Inscrit le {formatDate(a.created_at)}
          {a.approved_at && ` · approuvé le ${formatDate(a.approved_at)}`}
        </p>
      </div>

      {a.status === 'rejected' && a.rejection_reason && (
        <Alert variant="destructive">
          <AlertDescription>Motif du refus : {a.rejection_reason}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <ArtisanStatusActions
          artisanId={a.id}
          shopName={a.shop_name}
          status={a.status}
          size="default"
        />
        {a.status === 'approved' && (
          <Button variant="ghost" asChild>
            <Link to={`/artisans/${a.slug}`}>
              <ExternalLinkIcon />
              Boutique publique
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">Boutique</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Spécialité :</span> {a.specialty?.name ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Localisation :</span> {place || '—'}
              {a.address && ` (${a.address})`}
            </p>
            {a.bio && <p className="whitespace-pre-line">{a.bio}</p>}
            <p className="text-muted-foreground">
              {[
                a.facebook_url && 'Facebook',
                a.instagram_url && 'Instagram',
                a.whatsapp && 'WhatsApp',
              ]
                .filter(Boolean)
                .join(' · ') || 'Aucun réseau social'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">Compte</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{a.profile?.full_name}</p>
            <p>{a.profile?.email}</p>
            <p>Tél. {a.profile?.phone ?? '—'}</p>
            {a.profile && (
              <AccountActiveToggle
                userId={a.id}
                name={a.profile.full_name}
                active={a.profile.is_active}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">
              Produits {products.data && `(${products.data.total})`}
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.data?.rows.length ? (
            <ul className="divide-y text-sm">
              {products.data.rows.map((product) => (
                <li
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span className="font-medium">{product.name}</span>
                  <span className="flex items-center gap-3">
                    {formatPrice(product.price)} · stock {product.stock}
                    <ProductStatusBadge
                      status={product.status}
                      adminHidden={product.admin_hidden}
                    />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun produit.</p>
          )}
          {products.data && products.data.total > products.data.rows.length && (
            <Button variant="link" asChild className="px-0">
              <Link to={`/admin/produits?artisan=${a.id}`}>Voir tous ses produits</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">
              Commandes {orders.data && `(${orders.data.total})`}
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.data?.rows.length ? (
            <ul className="divide-y text-sm">
              {orders.data.rows.map((sub) => (
                <li key={sub.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <Link
                    to={`/admin/commandes/${sub.order?.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {sub.order?.order_number}
                  </Link>
                  <span className="flex items-center gap-3">
                    {formatDate(sub.created_at)} · {formatPrice(sub.total)}
                    <SubOrderStatusBadge status={sub.status} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune commande.</p>
          )}
          {orders.data && orders.data.total > orders.data.rows.length && (
            <Button variant="link" asChild className="px-0">
              <Link to={`/admin/commandes?artisan=${a.id}`}>Voir toutes ses commandes</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
