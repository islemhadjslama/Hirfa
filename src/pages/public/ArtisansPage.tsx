import { StoreIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { ArtisanCard, ArtisanCardSkeleton } from '@/components/common/ArtisanCard'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { ARTISANS_PER_PAGE, useArtisans, useCategories } from '@/features/catalog/api'
import { useUpdateParams } from '@/features/catalog/useUpdateParams'
import { GOVERNORATES } from '@/lib/constants'

/** CAT-7 — Artisans approuvés, filtrables par gouvernorat et spécialité. */
export default function ArtisansPage() {
  const [searchParams] = useSearchParams()
  const update = useUpdateParams()
  const categories = useCategories()

  const gouvernorat = searchParams.get('gouvernorat') ?? ''
  const specialite = searchParams.get('specialite') ?? ''
  const pageParam = Number(searchParams.get('page') ?? '1')
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1
  const specialiteId = categories.data?.find((c) => c.slug === specialite)?.id ?? null

  // On attend les catégories si une spécialité est demandée (slug → id)
  const waiting = Boolean(specialite) && categories.isPending
  const artisans = useArtisans({ gouvernorat, specialiteId, page })
  const total = artisans.data?.total ?? 0
  const pageCount = Math.ceil(total / ARTISANS_PER_PAGE)
  const loading = waiting || artisans.isPending

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Nos artisans</h1>
        <p className="mt-1 text-muted-foreground">
          Rencontrez les créateurs et créatrices de toute la Tunisie.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
        <div className="space-y-1.5">
          <label htmlFor="artisans-governorate" className="text-sm font-medium">
            Gouvernorat
          </label>
          <NativeSelect
            id="artisans-governorate"
            className="w-full"
            value={gouvernorat}
            onChange={(event) => update({ gouvernorat: event.target.value })}
          >
            <NativeSelectOption value="">Toute la Tunisie</NativeSelectOption>
            {GOVERNORATES.map((name) => (
              <NativeSelectOption key={name} value={name}>
                {name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="artisans-specialty" className="text-sm font-medium">
            Spécialité
          </label>
          <NativeSelect
            id="artisans-specialty"
            className="w-full"
            value={specialite}
            onChange={(event) => update({ specialite: event.target.value })}
          >
            <NativeSelectOption value="">Toutes les spécialités</NativeSelectOption>
            {(categories.data ?? []).map((category) => (
              <NativeSelectOption key={category.slug} value={category.slug}>
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>

      {artisans.isError ? (
        <ErrorState onRetry={() => void artisans.refetch()} />
      ) : !loading && total === 0 ? (
        <EmptyState
          icon={StoreIcon}
          title="Aucun artisan trouvé"
          description="Aucune boutique ne correspond à ces critères pour le moment."
          action={
            (gouvernorat || specialite) && (
              <Button
                variant="outline"
                onClick={() => update({ gouvernorat: null, specialite: null })}
              >
                Effacer les filtres
              </Button>
            )
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }, (_, index) => (
                <li key={index}>
                  <ArtisanCardSkeleton />
                </li>
              ))
            : artisans.data?.artisans.map((artisan) => (
                <li key={artisan.id}>
                  <ArtisanCard artisan={artisan} />
                </li>
              ))}
        </ul>
      )}

      <Pagination page={page} pageCount={pageCount} />
    </div>
  )
}
