import { EyeIcon, EyeOffIcon, ImageIcon, PackageIcon, StarIcon, StarOffIcon } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { AdminFilter, AdminSearch, AdminToolbar } from '@/components/admin/AdminToolbar'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { ArtisanStatusBadge, ProductStatusBadge } from '@/components/common/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ADMIN_PAGE_SIZE,
  useAdminArtisanOptions,
  useAdminCategories,
  useAdminProducts,
  useUpdateProductFlags,
  type AdminProduct,
  type AdminProductFilter,
} from '@/features/admin/api'
import { pageFromParams } from '@/features/admin/params'
import { getErrorMessage } from '@/lib/errors'
import { formatPrice } from '@/lib/format'
import { publicUrl } from '@/lib/storage'

const STATUS_OPTIONS: { value: Exclude<AdminProductFilter, null>; label: string }[] = [
  { value: 'published', label: 'Publiés' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'hidden', label: 'Masqués par l’admin' },
  { value: 'featured', label: 'Mis en avant' },
]

function ProductActions({ product }: { product: AdminProduct }) {
  const update = useUpdateProductFlags()

  function toggle(flags: { admin_hidden?: boolean; is_featured?: boolean }, message: string) {
    update.mutate(
      { productId: product.id, flags },
      {
        onSuccess: () => toast.success(message),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={update.isPending}
        onClick={() =>
          toggle(
            { admin_hidden: !product.admin_hidden },
            product.admin_hidden
              ? `« ${product.name} » est de nouveau visible.`
              : `« ${product.name} » est masqué du catalogue.`,
          )
        }
      >
        {product.admin_hidden ? <EyeIcon /> : <EyeOffIcon />}
        {product.admin_hidden ? 'Démasquer' : 'Masquer'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={update.isPending}
        onClick={() =>
          toggle(
            { is_featured: !product.is_featured },
            product.is_featured
              ? `« ${product.name} » n’est plus mis en avant.`
              : `« ${product.name} » est mis en avant sur l’accueil.`,
          )
        }
      >
        {product.is_featured ? <StarOffIcon /> : <StarIcon />}
        {product.is_featured ? 'Retirer de l’accueil' : 'Mettre en avant'}
      </Button>
    </div>
  )
}

/** ADM-4 — Tous les produits : filtres, masquer / démasquer, mettre en avant. */
export default function AdminProductsPage() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const artisanId = params.get('artisan')
  const categoryParam = params.get('categorie')
  const statusParam = params.get('statut')
  const status = STATUS_OPTIONS.some((o) => o.value === statusParam)
    ? (statusParam as AdminProductFilter)
    : null
  const page = pageFromParams(params)
  const categories = useAdminCategories()
  const artisans = useAdminArtisanOptions()
  const products = useAdminProducts({
    q,
    artisanId,
    categoryId: categoryParam ? Number(categoryParam) : null,
    status,
    page,
  })
  const total = products.data?.total ?? 0

  return (
    <div>
      <PageHeader title="Produits" description={`${total} produit${total > 1 ? 's' : ''}`} />
      <AdminToolbar>
        <AdminSearch key={q} value={q} placeholder="Rechercher un produit…" />
        <AdminFilter
          id="products-artisan"
          label="Artisan"
          param="artisan"
          value={artisanId ?? ''}
          allLabel="Tous les artisans"
          options={(artisans.data ?? []).map((a) => ({ value: a.id, label: a.shop_name }))}
        />
        <AdminFilter
          id="products-category"
          label="Catégorie"
          param="categorie"
          value={categoryParam ?? ''}
          allLabel="Toutes les catégories"
          options={(categories.data ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
        />
        <AdminFilter
          id="products-status"
          label="Statut"
          param="statut"
          value={status ?? ''}
          allLabel="Tous les statuts"
          options={STATUS_OPTIONS}
        />
      </AdminToolbar>

      {products.isPending ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : products.isError ? (
        <ErrorState onRetry={() => void products.refetch()} />
      ) : total === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title="Aucun produit"
          description="Aucun produit ne correspond."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="hidden md:table-cell">Artisan</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Stock</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.data.rows.map((product) => {
                const image = [...product.product_images].sort((a, b) => a.position - b.position)[0]
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                          {image ? (
                            <img
                              src={publicUrl('product-images', image.path)}
                              alt=""
                              loading="lazy"
                              className="size-full object-cover"
                            />
                          ) : (
                            <ImageIcon
                              className="size-4 text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-56 truncate font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category?.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {product.artisan && (
                        <span className="flex flex-col items-start gap-1">
                          <Link
                            to={`/admin/artisans/${product.artisan.id}`}
                            className="hover:text-primary"
                          >
                            {product.artisan.shop_name}
                          </Link>
                          {product.artisan.status !== 'approved' && (
                            <ArtisanStatusBadge status={product.artisan.status} />
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatPrice(product.price)}
                    </TableCell>
                    <TableCell className="hidden text-right lg:table-cell">
                      {product.stock}
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-col items-start gap-1">
                        <ProductStatusBadge
                          status={product.status}
                          adminHidden={product.admin_hidden}
                        />
                        {product.is_featured && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-900">
                            <StarIcon aria-hidden="true" />
                            Mis en avant
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ProductActions product={product} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <Pagination page={page} pageCount={Math.ceil(total / ADMIN_PAGE_SIZE)} />
    </div>
  )
}
