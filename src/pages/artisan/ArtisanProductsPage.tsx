import {
  EyeIcon,
  ImageIcon,
  PackageIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { ProductStatusBadge } from '@/components/common/StatusBadge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  mainImageUrl,
  useDeleteProduct,
  useMyProducts,
  type ArtisanProduct,
} from '@/features/artisan/api'
import { useProfile } from '@/hooks/useProfile'
import { getErrorMessage } from '@/lib/errors'
import { formatPrice } from '@/lib/format'

type StatusFilter = 'all' | 'published' | 'draft' | 'hidden'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'published', label: 'Publiés' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'hidden', label: 'Masqués par l’admin' },
]

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function Thumbnail({ product }: { product: ArtisanProduct }) {
  const url = mainImageUrl(product)
  return (
    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
      {url ? (
        <img src={url} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  )
}

function StockCell({ stock }: { stock: number }) {
  return stock === 0 ? (
    <span className="font-medium text-destructive">Rupture</span>
  ) : (
    <span>{stock}</span>
  )
}

/** ART-3 — Liste des produits de l'artisan. */
export default function ArtisanProductsPage() {
  const { profile } = useProfile()
  const products = useMyProducts(profile?.id)
  const deleteProduct = useDeleteProduct()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [toDelete, setToDelete] = useState<ArtisanProduct | null>(null)

  const filtered = useMemo(() => {
    const query = normalize(search.trim())
    return (products.data ?? []).filter((product) => {
      if (query && !normalize(product.name).includes(query)) return false
      if (status === 'hidden') return product.admin_hidden
      if (status !== 'all') return product.status === status
      return true
    })
  }, [products.data, search, status])

  function confirmDelete() {
    if (!toDelete) return
    const product = toDelete
    deleteProduct.mutate(product, {
      onSuccess: (result) => {
        if (result === 'deleted') {
          toast.success(`« ${product.name} » a été supprimé.`)
        } else {
          toast.info(
            `« ${product.name} » a déjà été commandé : il a été passé en brouillon au lieu d’être supprimé, pour conserver l’historique des commandes.`,
            { duration: 8000 },
          )
        }
        setToDelete(null)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    })
  }

  const actions = (product: ArtisanProduct) => (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon-sm" asChild>
        <Link
          to={`/artisan/produits/${product.id}/modifier`}
          aria-label={`Modifier ${product.name}`}
        >
          <PencilIcon />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-destructive"
        aria-label={`Supprimer ${product.name}`}
        onClick={() => setToDelete(product)}
      >
        <Trash2Icon />
      </Button>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Mes produits"
        description={
          products.data
            ? `${products.data.length} produit${products.data.length > 1 ? 's' : ''}`
            : undefined
        }
        actions={
          <Button asChild>
            <Link to="/artisan/produits/nouveau">
              <PlusIcon />
              Nouveau produit
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="product-search" className="sr-only">
            Rechercher un produit
          </label>
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="product-search"
            type="search"
            placeholder="Rechercher par nom…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <label htmlFor="product-status" className="sr-only">
          Filtrer par statut
        </label>
        <NativeSelect
          id="product-status"
          className="sm:w-56"
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
        >
          {STATUS_FILTERS.map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {products.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : products.isError ? (
        <ErrorState onRetry={() => void products.refetch()} />
      ) : products.data.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title="Aucun produit pour l’instant"
          description="Publiez votre première création : elle apparaîtra dans le catalogue."
          action={
            <Button asChild>
              <Link to="/artisan/produits/nouveau">
                <PlusIcon />
                Ajouter un produit
              </Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="Aucun résultat"
          description="Aucun produit ne correspond à votre recherche."
        />
      ) : (
        <>
          {/* Mobile : cartes */}
          <ul className="space-y-3 md:hidden">
            {filtered.map((product) => (
              <li key={product.id} className="flex gap-3 rounded-xl border bg-card p-3">
                <Thumbnail product={product} />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="text-sm">
                    {formatPrice(product.price)} · Stock : <StockCell stock={product.stock} />
                  </p>
                  <ProductStatusBadge status={product.status} adminHidden={product.admin_hidden} />
                </div>
                {actions(product)}
              </li>
            ))}
          </ul>

          {/* Tablette et ordinateur : tableau */}
          <div className="hidden rounded-xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Image</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">
                    <EyeIcon className="ml-auto size-4" aria-label="Vues" />
                  </TableHead>
                  <TableHead className="w-24">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Thumbnail product={product} />
                    </TableCell>
                    <TableCell className="max-w-64 truncate font-medium">{product.name}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatPrice(product.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <StockCell stock={product.stock} />
                    </TableCell>
                    <TableCell>
                      <ProductStatusBadge
                        status={product.status}
                        adminHidden={product.admin_hidden}
                      />
                    </TableCell>
                    <TableCell className="text-right">{product.views_count}</TableCell>
                    <TableCell>{actions(product)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {toDelete?.name} » sera définitivement supprimé, avec ses images. S’il a déjà été
              commandé, il sera seulement passé en brouillon pour conserver l’historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProduct.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteProduct.isPending}
              onClick={(event) => {
                event.preventDefault()
                confirmDelete()
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
