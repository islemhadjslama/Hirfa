import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { useArtisanOptions, useCategories, type CatalogFilters } from '@/features/catalog/api'
import { useUpdateParams } from '@/features/catalog/useUpdateParams'
import { GOVERNORATES } from '@/lib/constants'

function FilterSelect({
  id,
  label,
  value,
  onChange,
  allLabel,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  allLabel: string
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <NativeSelect
        id={id}
        className="w-full"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <NativeSelectOption value="">{allLabel}</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}

/** Prix min / max : appliqués à la validation (Entrée ou bouton). */
function PriceFilter({ min, max }: { min: string; max: string }) {
  const update = useUpdateParams()
  const [localMin, setLocalMin] = useState(min)
  const [localMax, setLocalMax] = useState(max)

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const clean = (value: string) =>
      value
        .trim()
        .replace(',', '.')
        .replace(/[^\d.]/g, '')
    update({ min: clean(localMin) || null, max: clean(localMax) || null })
  }

  return (
    <form onSubmit={apply} className="space-y-1.5">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Prix (DT)</legend>
        <div className="flex items-center gap-2">
          <label htmlFor="price-min" className="sr-only">
            Prix minimum
          </label>
          <Input
            id="price-min"
            inputMode="decimal"
            placeholder="Min"
            value={localMin}
            onChange={(event) => setLocalMin(event.target.value)}
            className="h-10"
          />
          <span aria-hidden="true">–</span>
          <label htmlFor="price-max" className="sr-only">
            Prix maximum
          </label>
          <Input
            id="price-max"
            inputMode="decimal"
            placeholder="Max"
            value={localMax}
            onChange={(event) => setLocalMax(event.target.value)}
            className="h-10"
          />
          <Button type="submit" variant="outline" className="h-10">
            OK
          </Button>
        </div>
      </fieldset>
    </form>
  )
}

/** Panneau des filtres du catalogue (sidebar sur ordinateur, tiroir sur mobile). */
export function CatalogFiltersPanel({ filters }: { filters: CatalogFilters }) {
  const update = useUpdateParams()
  const categories = useCategories()
  const artisans = useArtisanOptions()

  return (
    <div className="space-y-5">
      <FilterSelect
        id="filter-category"
        label="Catégorie"
        allLabel="Toutes les catégories"
        value={filters.categorie}
        onChange={(value) => update({ categorie: value })}
        options={(categories.data ?? []).map((c) => ({ value: c.slug, label: c.name }))}
      />
      <PriceFilter key={`${filters.min}|${filters.max}`} min={filters.min} max={filters.max} />
      <FilterSelect
        id="filter-governorate"
        label="Gouvernorat de l’artisan"
        allLabel="Toute la Tunisie"
        value={filters.gouvernorat}
        onChange={(value) => update({ gouvernorat: value })}
        options={GOVERNORATES.map((name) => ({ value: name, label: name }))}
      />
      <FilterSelect
        id="filter-artisan"
        label="Artisan"
        allLabel="Tous les artisans"
        value={filters.artisan}
        onChange={(value) => update({ artisan: value })}
        options={(artisans.data ?? []).map((a) => ({ value: a.slug, label: a.shop_name }))}
      />
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={filters.stock}
          onChange={(event) => update({ stock: event.target.checked ? '1' : null })}
        />
        En stock uniquement
      </label>
    </div>
  )
}
