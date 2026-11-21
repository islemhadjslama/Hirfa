import { RefreshCwIcon, TriangleAlertIcon } from 'lucide-react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

import { Logo } from '@/components/common/Logo'
import { Button } from '@/components/ui/button'

/** Chunk introuvable après un nouveau déploiement (pages chargées à la demande). */
function isChunkLoadError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(
      error.message,
    )
  )
}

/**
 * Page d'erreur de toutes les routes (remplace la page anglaise par défaut de
 * React Router) : erreur de rendu, page introuvable, mise à jour du site.
 */
export function RouteErrorPage() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  const outdated = isChunkLoadError(error)

  if (import.meta.env.DEV) console.error(error)

  const title = notFound
    ? 'Page introuvable'
    : outdated
      ? 'Le site a été mis à jour'
      : 'Une erreur inattendue est survenue'
  const description = notFound
    ? 'La page que vous cherchez n’existe pas ou a été déplacée.'
    : outdated
      ? 'Rechargez la page pour obtenir la dernière version.'
      : 'Rechargez la page ou revenez à l’accueil. Si le problème persiste, contactez-nous.'

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <Logo />
      <TriangleAlertIcon className="size-12 text-primary" aria-hidden="true" />
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {!notFound && (
          <Button onClick={() => window.location.reload()}>
            <RefreshCwIcon />
            Recharger la page
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link to="/" reloadDocument>
            Retour à l’accueil
          </Link>
        </Button>
      </div>
    </main>
  )
}
