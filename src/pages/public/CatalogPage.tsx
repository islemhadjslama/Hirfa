import { SearchXIcon, SlidersHorizontalIcon, XIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Pagination } from '@/components/common/Pagination'
import { ProductGrid } from '@/components/common/ProductCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  CATALOG_SORTS,
  parseCatalogParams,
  useArtisanOptions,
  useCatalogProducts,
  useCategories,
  type CatalogSort,
} from '@/features/catalog/api'
import { CatalogFiltersPanel } from '@/features/catalog/CatalogFiltersPanel'
import { useUpdateParams } from '@/features/catalog/useUpdateParams'
import { PRODUCTS_PER_PAGE } from '@/lib/constants'
import { formatPrice } from '@/lib/format'

/** CAT-1 à CAT-4 — Catalogue : recherche, filtres, tri, pagination (12 par page). */
export default function CatalogPage() {
  const [searchParams] = useSearchParams()
  const filters = useMemo(() => parseCatalogParams(searchParams), [searchParams])
  const update = useUpdateParams()
  const catalog = useCatalogProducts(filters)
  const categories = useCategories()
  const artisans = useArtisanOptions()

  const categoryName = categories.data?.find((c) => c.slug === filters.categorie)?.name
  const artisanName = artisans.data?.find((a) => a.slug === filters.artisan)?.shop_name

  // Filtres actifs, affichés en « puces » supprimables
  const chips: { key: string; label: string; clear: Record<string, null> }[] = []
  if (filters.q) chips.push({ key: 'q', label: `« ${filters.q} »`, clear: { q: null } })
  if (filters.categorie)
    chips.push({ key: 'cat', label: categoryName ?? filters.categorie, clear: { categorie: null } })
  if (filters.min || filters.max) {
    const label =
      filters.min && filters.max
        ? `${formatPrice(filters.min)} – ${formatPrice(filters.max)}`
        : filters.min
          ? `Dès ${formatPrice(filters.min)}`
          : `Jusqu’à ${formatPrice(filters.max)}`
    chips.push({ key: 'price', label, clear: { min: null, max: null } })
  }
  if (filters.gouvernorat)
    chips.push({ key: 'gov', label: filters.gouvernorat, clear: { gouvernorat: null } })
  if (filters.artisan)
    chips.push({ key: 'art', label: artisanName ?? filters.artisan, clear: { artisan: null } })
  if (filters.stock) chips.push({ key: 'stock', label: 'En stock', clear: { stock: null } })

  const filterCount = chips.filter((chip) => chip.key !== 'q').length
  const total = catalog.data?.total ?? 0
  const pageCount = Math.ceil(total / PRODUCTS_PER_PAGE)
  const title = filters.q ? `Résultats pour « ${filters.q} »` : (categoryName ?? 'Catalogue')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
          {catalog.isPending
            ? 'Chargement…'
            : `${total} ${total > 1 ? 'produits artisanaux' : 'produit artisanal'}`}
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-8">
        <aside className="hidden lg:block" aria-label="Filtres">
          <div className="sticky top-24 rounded-2xl border bg-card p-4">
            <h2 className="mb-4 font-sans text-sm font-semibold tracking-normal">Filtrer</h2>
            <CatalogFiltersPanel filters={filters} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontalIcon />
                  Filtres
                  {filterCount > 0 && <Badge>{filterCount}</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtres</SheetTitle>
                  <SheetDescription>Les résultats se mettent à jour aussitôt.</SheetDescription>
                </SheetHeader>
                <div className="px-4 pb-6">
                  <CatalogFiltersPanel filters={filters} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="ml-auto flex items-center gap-2">
              <label htmlFor="catalog-sort" className="text-sm text-muted-foreground">
                Trier par
              </label>
              <NativeSelect
                id="catalog-sort"
                value={filters.tri}
                onChange={(event) => {
                  const tri = event.target.value as CatalogSort
                  update({ tri: tri === 'recent' ? null : tri })
                }}
              >
                {Object.entries(CATALOG_SORTS).map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>

          {chips.length > 0 && (
            <ul className="mb-4 flex flex-wrap gap-2" aria-label="Filtres actifs">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    onClick={() => update(chip.clear)}
                    className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-sm hover:border-primary hover:text-primary"
                    aria-label={`Retirer le filtre ${chip.label}`}
                  >
                    {chip.label}
                    <XIcon className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
              {chips.length > 1 && (
                <li>
                  <Button variant="link" size="sm" asChild>
                    <Link to="/catalogue">Tout effacer</Link>
                  </Button>
                </li>
              )}
            </ul>
          )}

          {catalog.isError ? (
            <ErrorState onRetry={() => void catalog.refetch()} />
          ) : !catalog.isPending && total === 0 ? (
            <EmptyState
              icon={SearchXIcon}
              title="Aucun produit trouvé"
              description="Essayez d’autres mots-clés ou retirez des filtres."
              action={
                <Button variant="outline" asChild>
                  <Link to="/catalogue">Voir tout le catalogue</Link>
                </Button>
              }
            />
          ) : catalog.data && catalog.data.products.length === 0 ? (
            <EmptyState
              icon={SearchXIcon}
              title="Cette page n’existe pas"
              description={`Le catalogue compte ${pageCount} page${pageCount > 1 ? 's' : ''}.`}
              action={
                <Button variant="outline" onClick={() => update({})}>
                  Revenir à la première page
                </Button>
              }
            />
          ) : (
            <div className={catalog.isPlaceholderData ? 'opacity-60 transition' : undefined}>
              <ProductGrid
                products={catalog.data?.products}
                loading={catalog.isPending}
                skeletons={PRODUCTS_PER_PAGE}
                className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
              />
            </div>
          )}

          <Pagination page={filters.page} pageCount={pageCount} />
        </div>
      </div>
    </div>
  )
}
