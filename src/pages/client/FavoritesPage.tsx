import { HeartIcon, Trash2Icon } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ProductGrid } from '@/components/common/ProductCard'
import { AccountNav } from '@/components/layout/AccountNav'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useFavoriteProducts, useToggleFavorite } from '@/features/favorites/api'
import { getErrorMessage } from '@/lib/errors'

/** CLI-5 — Produits favoris (retrait via le cœur de chaque carte). */
export default function FavoritesPage() {
  const favorites = useFavoriteProducts()
  const toggle = useToggleFavorite()
  const unavailable = favorites.data?.unavailableIds ?? []

  function removeUnavailable() {
    for (const productId of unavailable) {
      toggle.mutate(
        { productId, favorite: false },
        { onError: (error) => toast.error(getErrorMessage(error)) },
      )
    }
    toast.success('Produits indisponibles retirés de vos favoris.')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-4 text-3xl font-semibold">Mes favoris</h1>
      <AccountNav />

      {favorites.isError ? (
        <ErrorState onRetry={() => void favorites.refetch()} />
      ) : favorites.data && favorites.data.products.length === 0 && unavailable.length === 0 ? (
        <EmptyState
          icon={HeartIcon}
          title="Aucun favori pour l’instant"
          description="Touchez le cœur d’un produit pour le retrouver ici."
          action={
            <Button asChild>
              <Link to="/catalogue">Découvrir le catalogue</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {unavailable.length > 0 && (
            <Alert>
              <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {unavailable.length} produit{unavailable.length > 1 ? 's' : ''} de vos favoris
                  {unavailable.length > 1 ? ' ne sont' : ' n’est'} plus disponible
                  {unavailable.length > 1 ? 's' : ''}.
                </span>
                <Button variant="outline" size="sm" onClick={removeUnavailable}>
                  <Trash2Icon />
                  Retirer
                </Button>
              </AlertDescription>
            </Alert>
          )}
          <ProductGrid products={favorites.data?.products} loading={favorites.isPending} />
        </div>
      )}
    </div>
  )
}
