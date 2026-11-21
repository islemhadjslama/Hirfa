import { ConstructionIcon } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'

/** Page provisoire pour les routes qui seront réalisées dans les phases suivantes. */
export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-6 text-3xl font-semibold">{title}</h1>
      <EmptyState
        icon={ConstructionIcon}
        title="Bientôt disponible"
        description="Cette page est en cours de construction."
        action={
          <Button variant="outline" asChild>
            <Link to="/">Retour à l’accueil</Link>
          </Button>
        }
      />
    </section>
  )
}
