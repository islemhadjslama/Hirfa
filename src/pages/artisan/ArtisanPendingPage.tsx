import { BanIcon, ClockIcon, Loader2Icon, XCircleIcon, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { PageLoader } from '@/components/common/PageLoader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useResubmitArtisan } from '@/features/auth/api'
import { useProfile } from '@/hooks/useProfile'
import { CONTACT_EMAIL } from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/format'
import { ARTISAN_STATUS_LABELS } from '@/lib/labels'

function StatusCard({
  icon: Icon,
  tone,
  title,
  children,
}: {
  icon: LucideIcon
  tone: string
  title: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <span className={`flex size-14 items-center justify-center rounded-full ${tone}`}>
          <Icon className="size-7" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="max-w-lg space-y-4 text-sm text-muted-foreground">{children}</div>
      </CardContent>
    </Card>
  )
}

/** ART-1 — Statut de la boutique tant qu'elle n'est pas approuvée. */
export default function ArtisanPendingPage() {
  const navigate = useNavigate()
  const { profile, isLoading } = useProfile()
  const resubmit = useResubmitArtisan()
  const shop = profile?.artisan_profiles

  if (isLoading) return <PageLoader />
  if (!profile || !shop) return <Navigate to="/" replace />
  if (shop.status === 'approved') return <Navigate to="/artisan" replace />

  function handleResubmit() {
    if (!shop) return
    resubmit.mutate(shop.id, {
      onSuccess: () => {
        toast.success('Votre demande a été renvoyée. Complétez votre boutique en attendant.')
        navigate('/artisan/boutique')
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold sm:text-3xl">{shop.shop_name}</h1>
        <Badge variant="secondary">{ARTISAN_STATUS_LABELS[shop.status]}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Demande envoyée le {formatDate(shop.created_at)}
      </p>

      {shop.status === 'pending' && (
        <StatusCard
          icon={ClockIcon}
          tone="bg-secondary text-primary"
          title="En cours de validation"
        >
          <p>
            Un administrateur vérifie votre boutique. Vous pourrez publier vos produits dès son
            approbation.
          </p>
          <p>En attendant, complétez votre boutique : bio, logo, bannière, réseaux sociaux.</p>
          <Button asChild>
            <Link to="/artisan/boutique">Compléter ma boutique</Link>
          </Button>
        </StatusCard>
      )}

      {shop.status === 'rejected' && (
        <StatusCard
          icon={XCircleIcon}
          tone="bg-destructive/10 text-destructive"
          title="Votre demande a été refusée"
        >
          <Alert variant="destructive" className="text-left">
            <AlertTitle>Motif du refus</AlertTitle>
            <AlertDescription>{shop.rejection_reason || 'Aucun motif précisé.'}</AlertDescription>
          </Alert>
          <p>Corrigez votre boutique puis renvoyez votre demande de validation.</p>
          <Button onClick={handleResubmit} disabled={resubmit.isPending}>
            {resubmit.isPending && <Loader2Icon className="animate-spin" />}
            Modifier ma boutique et resoumettre
          </Button>
        </StatusCard>
      )}

      {shop.status === 'suspended' && (
        <StatusCard icon={BanIcon} tone="bg-muted text-foreground" title="Boutique suspendue">
          <p>
            Votre boutique a été suspendue par l’administration : vos produits ne sont plus visibles
            dans le catalogue.
          </p>
          <p>
            Pour en savoir plus, contactez-nous à{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </StatusCard>
      )}
    </div>
  )
}
