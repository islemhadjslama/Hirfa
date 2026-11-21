import {
  ArrowRightIcon,
  BanknoteIcon,
  HammerIcon,
  MousePointerClickIcon,
  PackageIcon,
  ShoppingBagIcon,
  StoreIcon,
  TruckIcon,
} from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/common/EmptyState'
import { HeroIllustration } from '@/components/common/HeroIllustration'
import { Button } from '@/components/ui/button'
import { HOME_CATEGORIES } from '@/features/catalog/home-categories'

const STEPS = [
  {
    icon: MousePointerClickIcon,
    title: 'Choisissez',
    text: 'Parcourez les créations de dizaines d’artisans de toute la Tunisie.',
  },
  {
    icon: ShoppingBagIcon,
    title: 'Commandez',
    text: 'Un seul panier, même pour plusieurs artisans. Chacun prépare son colis.',
  },
  {
    icon: BanknoteIcon,
    title: 'Payez à la livraison',
    text: 'Aucun paiement en ligne : vous réglez en espèces à la réception.',
  },
]

function SectionHeading({
  id,
  title,
  subtitle,
  link,
}: {
  id: string
  title: string
  subtitle?: string
  link?: { to: string; label: string }
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id={id} className="text-2xl font-semibold sm:text-3xl">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {link && (
        <Link
          to={link.to}
          className="inline-flex items-center gap-1 text-sm font-medium text-sidi-bou hover:underline"
        >
          {link.label}
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

export default function HomePage() {
  return (
    <>
      {/* ACC-1 — Hero */}
      <section className="overflow-hidden bg-secondary">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-20">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-medium text-olive">
              <HammerIcon className="size-3.5" aria-hidden="true" />
              Fait main en Tunisie
            </p>
            <h1 className="text-4xl leading-tight font-semibold text-balance sm:text-5xl">
              Achetez directement auprès des artisans tunisiens
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Poteries de Nabeul, tapis de Kairouan, bijoux de Djerba… Découvrez des pièces uniques,
              commandez en ligne et payez à la livraison.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/catalogue">
                  Découvrir le catalogue
                  <ArrowRightIcon />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/artisans">Rencontrer les artisans</Link>
              </Button>
            </div>
          </div>
          <HeroIllustration className="mx-auto max-w-sm md:max-w-md" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 md:py-16">
        {/* ACC-2 — Choix du profil */}
        <section aria-labelledby="choix-profil" className="grid gap-4 md:grid-cols-2">
          <h2 id="choix-profil" className="sr-only">
            Vous êtes…
          </h2>
          <article className="flex flex-col gap-4 rounded-2xl bg-terracotta p-6 text-white sm:p-8">
            <StoreIcon className="size-10" aria-hidden="true" />
            <h3 className="text-2xl font-semibold">Je suis artisan</h3>
            <p className="text-white/90">
              Ouvrez gratuitement votre boutique en ligne, publiez vos créations et recevez des
              commandes de toute la Tunisie. Sans commission.
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/artisan/inscription">Ouvrir ma boutique</Link>
              </Button>
              <Link to="/connexion" className="text-sm font-medium underline underline-offset-4">
                J’ai déjà un compte
              </Link>
            </div>
          </article>
          <article className="flex flex-col gap-4 rounded-2xl bg-sidi-bou p-6 text-white sm:p-8">
            <ShoppingBagIcon className="size-10" aria-hidden="true" />
            <h3 className="text-2xl font-semibold">Je suis client</h3>
            <p className="text-white/90">
              Trouvez des pièces authentiques, faites main, et commandez auprès de plusieurs
              artisans en une seule fois. Paiement à la livraison.
            </p>
            <div className="mt-auto">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/catalogue">Parcourir le catalogue</Link>
              </Button>
            </div>
          </article>
        </section>

        {/* ACC-3 — Catégories */}
        <section aria-labelledby="categories">
          <SectionHeading
            id="categories"
            title="Catégories"
            subtitle="Tous les savoir-faire de l’artisanat tunisien"
            link={{ to: '/catalogue', label: 'Tout voir' }}
          />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {HOME_CATEGORIES.map(({ name, slug, icon: Icon }) => (
              <li key={slug}>
                <Link
                  to={`/catalogue?categorie=${slug}`}
                  className="group flex h-full flex-col items-center gap-3 rounded-2xl border bg-card p-4 text-center transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-7" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium">{name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ACC-4 — Produits mis en avant (dynamique en Phase 4) */}
        <section aria-labelledby="produits-vedette">
          <h2 id="produits-vedette" className="mb-6 text-2xl font-semibold sm:text-3xl">
            Coups de cœur
          </h2>
          <EmptyState
            icon={PackageIcon}
            title="Bientôt nos produits mis en avant"
            description="Les créations sélectionnées par l’équipe Hirfa apparaîtront ici."
          />
        </section>

        {/* ACC-5 — Artisans mis en avant (dynamique en Phase 4) */}
        <section aria-labelledby="artisans-vedette">
          <h2 id="artisans-vedette" className="mb-6 text-2xl font-semibold sm:text-3xl">
            Nouveaux artisans
          </h2>
          <EmptyState
            icon={StoreIcon}
            title="Bientôt nos artisans"
            description="Les dernières boutiques ouvertes sur Hirfa apparaîtront ici."
          />
        </section>

        {/* ACC-6 — Comment ça marche */}
        <section aria-labelledby="comment-ca-marche">
          <h2
            id="comment-ca-marche"
            className="mb-8 text-center text-2xl font-semibold sm:text-3xl"
          >
            Comment ça marche ?
          </h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="relative rounded-2xl border bg-card p-6 text-center">
                <span className="absolute top-4 left-4 font-heading text-3xl font-semibold text-primary/20">
                  {index + 1}
                </span>
                <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-olive text-white">
                  <Icon className="size-7" aria-hidden="true" />
                </span>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <TruckIcon className="size-4" aria-hidden="true" />
            Chaque artisan expédie son propre colis.
          </p>
        </section>
      </div>
    </>
  )
}
