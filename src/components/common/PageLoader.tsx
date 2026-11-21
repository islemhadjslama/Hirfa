import { Loader2Icon } from 'lucide-react'

/** Indicateur affiché pendant le chargement paresseux d'une page. */
export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status">
      <Loader2Icon className="size-8 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">Chargement…</span>
    </div>
  )
}
