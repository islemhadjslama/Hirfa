import { CompassIcon } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
      <CompassIcon className="size-12 text-primary" aria-hidden="true" />
      <p className="font-heading text-6xl font-semibold text-primary">404</p>
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <p className="text-muted-foreground">
        La page que vous cherchez n’existe pas ou a été déplacée.
      </p>
      <Button asChild>
        <Link to="/">Retour à l’accueil</Link>
      </Button>
    </section>
  )
}
