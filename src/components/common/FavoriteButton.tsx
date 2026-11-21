import { HeartIcon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/api'
import { useProfile } from '@/hooks/useProfile'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

type FavoriteButtonProps = {
  productId: number
  productName: string
  className?: string
  /** Bouton avec libellé (fiche produit) ou simple icône (cartes). */
  withLabel?: boolean
}

/** CAT-5 / CLI-5 — Visiteur → connexion ; client → ajout ou retrait des favoris. */
export function FavoriteButton({
  productId,
  productName,
  className,
  withLabel,
}: FavoriteButtonProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useProfile()
  const favorites = useFavoriteIds()
  const toggle = useToggleFavorite()
  const isFavorite = favorites.data?.has(productId) ?? false

  function handleClick() {
    if (!profile) {
      const redirect = encodeURIComponent(location.pathname + location.search)
      navigate(`/connexion?redirect=${redirect}`)
      return
    }
    if (profile.role !== 'client') {
      toast.info('Les favoris sont réservés aux comptes clients.')
      return
    }
    toggle.mutate(
      { productId, favorite: !isFavorite },
      {
        onSuccess: () =>
          toast.success(isFavorite ? 'Retiré de vos favoris.' : 'Ajouté à vos favoris.'),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    )
  }

  const label = isFavorite
    ? `Retirer « ${productName} » des favoris`
    : `Ajouter « ${productName} » aux favoris`

  return (
    <Button
      type="button"
      variant={withLabel ? 'outline' : 'secondary'}
      size={withLabel ? 'lg' : 'icon-sm'}
      aria-label={withLabel ? undefined : label}
      aria-pressed={isFavorite}
      onClick={handleClick}
      className={cn(!withLabel && 'rounded-full bg-card/90 shadow-sm backdrop-blur', className)}
    >
      <HeartIcon className={cn(isFavorite && 'fill-primary text-primary')} />
      {withLabel && (isFavorite ? 'Dans vos favoris' : 'Ajouter aux favoris')}
    </Button>
  )
}
