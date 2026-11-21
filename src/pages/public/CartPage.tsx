import {
  ImageIcon,
  ShoppingBagIcon,
  StoreIcon,
  Trash2Icon,
  TriangleAlertIcon,
  TruckIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { QuantityStepper } from '@/components/common/QuantityStepper'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCart, type CartGroup, type CartLine } from '@/features/cart/useCart'
import { useProfile } from '@/hooks/useProfile'
import { formatPrice } from '@/lib/format'
import { publicUrl } from '@/lib/storage'
import { useCartStore } from '@/stores/cart'

function LineRow({ line }: { line: CartLine }) {
  const setQuantity = useCartStore((state) => state.setQuantity)
  const remove = useCartStore((state) => state.remove)

  return (
    <li className="flex gap-3 py-4 first:pt-0 last:pb-0">
      <Link
        to={`/produits/${line.slug}`}
        className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted"
        tabIndex={-1}
        aria-hidden="true"
      >
        {line.imagePath ? (
          <img
            src={publicUrl('product-images', line.imagePath)}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground" />
        )}
      </Link>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={`/produits/${line.slug}`}
              className="line-clamp-2 font-medium hover:text-primary"
            >
              {line.name}
            </Link>
            <p className="text-sm text-muted-foreground">{formatPrice(line.price)} l’unité</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            aria-label={`Retirer « ${line.name} » du panier`}
            onClick={() => {
              remove(line.productId)
              toast.success(`« ${line.name} » retiré du panier.`)
            }}
          >
            <Trash2Icon />
          </Button>
        </div>
        {line.problem ? (
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
            <TriangleAlertIcon className="size-4" aria-hidden="true" />
            {line.problem} Retirez-le pour commander.
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <QuantityStepper
              size="sm"
              label={line.name}
              value={line.quantity}
              max={line.stock}
              onChange={(quantity) => setQuantity(line.productId, quantity)}
            />
            <p className="font-semibold">{formatPrice(line.lineTotal)}</p>
          </div>
        )}
        {!line.problem && line.quantity === line.stock && (
          <p className="text-xs text-muted-foreground">Quantité maximale disponible.</p>
        )}
      </div>
    </li>
  )
}

function GroupCard({ group }: { group: CartGroup }) {
  return (
    <section aria-label={`Articles de ${group.artisanName}`} className="rounded-2xl border bg-card">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <StoreIcon className="size-4 text-olive" aria-hidden="true" />
        <p className="text-sm">
          Vendu et expédié par{' '}
          <Link to={`/artisans/${group.artisanSlug}`} className="font-semibold hover:text-primary">
            {group.artisanName}
          </Link>
        </p>
      </header>
      <ul className="divide-y px-4 py-4">
        {group.lines.map((line) => (
          <LineRow key={line.productId} line={line} />
        ))}
      </ul>
      <dl className="space-y-1 border-t bg-muted/40 px-4 py-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Sous-total</dt>
          <dd>{formatPrice(group.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Livraison</dt>
          <dd>{formatPrice(group.shippingFee)}</dd>
        </div>
        <div className="flex justify-between font-semibold">
          <dt>Total pour cet artisan</dt>
          <dd>{formatPrice(group.total)}</dd>
        </div>
      </dl>
    </section>
  )
}

/** PAN-2 / PAN-3 — Panier groupé par artisan. */
export default function CartPage() {
  const navigate = useNavigate()
  const cart = useCart()
  const clear = useCartStore((state) => state.clear)
  const { profile } = useProfile()
  const [confirmClear, setConfirmClear] = useState(false)

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState
          icon={ShoppingBagIcon}
          title="Votre panier est vide"
          description="Parcourez le catalogue pour découvrir les créations de nos artisans."
          action={
            <Button asChild>
              <Link to="/catalogue">Découvrir le catalogue</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const notClient = profile !== null && profile.role !== 'client'
  const parcels = cart.groups.filter((group) => group.shippingFee > 0).length
  const canCheckout = !notClient && !cart.hasProblems && !cart.isChecking && !cart.isError

  function handleCheckout() {
    // PAN-3 : un visiteur passe par la connexion puis revient sur /commande
    navigate(profile ? '/commande' : '/connexion?redirect=%2Fcommande')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Mon panier</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cart.count} article{cart.count > 1 ? 's' : ''} · {cart.groups.length} artisan
            {cart.groups.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
          <Trash2Icon />
          Vider le panier
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-4">
          {cart.isError && <ErrorState onRetry={cart.refetch} />}
          {cart.groups.map((group) => (
            <GroupCard key={group.artisanSlug} group={group} />
          ))}
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border bg-card p-4 lg:sticky lg:top-24">
          <h2 className="font-sans text-base font-semibold tracking-normal">Récapitulatif</h2>
          {cart.isChecking ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Sous-total</dt>
                <dd>{formatPrice(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Livraison ({parcels} colis × {formatPrice(cart.shippingFee)})
                </dt>
                <dd>{formatPrice(cart.shippingTotal)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd className="text-primary">{formatPrice(cart.total)}</dd>
              </div>
            </dl>
          )}
          <p className="flex items-start gap-2 rounded-xl bg-secondary px-3 py-2 text-sm">
            <TruckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              <strong>Paiement à la livraison.</strong> Chaque artisan expédie son propre colis.
            </span>
          </p>

          {notClient && (
            <Alert variant="destructive">
              <AlertDescription>
                Seuls les clients peuvent commander. Connectez-vous avec un compte client.
              </AlertDescription>
            </Alert>
          )}
          {cart.hasProblems && (
            <Alert variant="destructive">
              <AlertDescription>
                Certains produits ne sont plus disponibles : retirez-les pour continuer.
              </AlertDescription>
            </Alert>
          )}

          <Button size="lg" className="w-full" disabled={!canCheckout} onClick={handleCheckout}>
            Passer la commande
          </Button>
          <Button variant="link" asChild className="w-full">
            <Link to="/catalogue">Continuer mes achats</Link>
          </Button>
        </aside>
      </div>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vider le panier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tous les articles ({cart.count}) seront retirés de votre panier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                clear()
                toast.success('Votre panier a été vidé.')
              }}
            >
              Vider le panier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
