import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, BanknoteIcon, Loader2Icon, ShoppingBagIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { SelectField } from '@/components/common/SelectField'
import { TextareaField } from '@/components/common/TextareaField'
import { TextField } from '@/components/common/TextField'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Profile } from '@/features/auth/api'
import { normalizePhone } from '@/features/auth/schemas'
import { usePlaceOrder } from '@/features/cart/api'
import { checkoutSchema, type CheckoutValues } from '@/features/cart/schemas'
import { useCart } from '@/features/cart/useCart'
import { useProfile } from '@/hooks/useProfile'
import { GOVERNORATES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'
import { formatPrice } from '@/lib/format'
import { useCartStore } from '@/stores/cart'

const GOVERNORATE_OPTIONS = GOVERNORATES.map((name) => ({ value: name, label: name }))

/** « 22123456 » → « 22 123 456 » */
function formatPhone(value: string | null): string {
  const digits = (value ?? '').replace(/\D/g, '')
  return digits.length === 8
    ? `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
    : (value ?? '')
}

/** PAN-4 / PAN-5 — Validation de la commande (route réservée aux clients). */
export default function CheckoutPage() {
  const { profile } = useProfile()
  if (!profile) return null
  // `key` : le formulaire est pré-rempli une fois le profil chargé
  return <Checkout key={profile.id} profile={profile} />
}

function Checkout({ profile }: { profile: Profile }) {
  const navigate = useNavigate()
  const cart = useCart()
  const clear = useCartStore((state) => state.clear)
  const placeOrder = usePlaceOrder()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: profile.full_name,
      phone: formatPhone(profile.phone),
      governorate: profile.governorate ?? '',
      city: profile.city ?? '',
      address: profile.address ?? '',
      notes: '',
    },
  })

  if (cart.items.length === 0 && !placeOrder.isSuccess) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState
          icon={ShoppingBagIcon}
          title="Votre panier est vide"
          description="Ajoutez des produits à votre panier avant de commander."
          action={
            <Button asChild>
              <Link to="/catalogue">Découvrir le catalogue</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const onSubmit = handleSubmit((values) => {
    if (cart.hasProblems) {
      toast.error(
        'Certains produits ne sont plus disponibles : revenez au panier pour les retirer.',
      )
      return
    }
    placeOrder.mutate(
      {
        items: cart.orderItems,
        shipping: {
          full_name: values.fullName,
          phone: normalizePhone(values.phone),
          governorate: values.governorate,
          city: values.city,
          address: values.address,
          notes: values.notes,
        },
      },
      {
        // PAN-6 : panier vidé, redirection vers la confirmation
        onSuccess: (orderId) => {
          navigate(`/commande/confirmation/${orderId}`, { replace: true })
          clear()
          toast.success('Votre commande a été enregistrée. Merci !')
        },
      },
    )
  })

  const parcels = cart.groups.filter((group) => group.shippingFee > 0).length

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
        <Link to="/panier">
          <ArrowLeftIcon />
          Retour au panier
        </Link>
      </Button>
      <h1 className="mb-6 text-3xl font-semibold">Finaliser ma commande</h1>

      <form
        noValidate
        onSubmit={onSubmit}
        className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_24rem]"
      >
        <div className="min-w-0 space-y-6">
          {placeOrder.isError && (
            // PAN-5 : message clair, le panier est conservé
            <Alert variant="destructive" role="alert">
              <AlertTitle>La commande n’a pas pu être enregistrée</AlertTitle>
              <AlertDescription>
                <p>{getErrorMessage(placeOrder.error)}</p>
                <p>
                  Votre panier est conservé.{' '}
                  <Link to="/panier" className="font-medium underline">
                    Modifier le panier
                  </Link>
                </p>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="text-lg font-semibold">Adresse de livraison</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Nom complet du destinataire"
                  autoComplete="name"
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />
                <TextField
                  label="Téléphone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="22 123 456"
                  description="L’artisan ou le livreur vous appellera à ce numéro."
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Gouvernorat"
                  placeholder="Choisir un gouvernorat"
                  options={GOVERNORATE_OPTIONS}
                  error={errors.governorate?.message}
                  {...register('governorate')}
                />
                <TextField
                  label="Ville"
                  autoComplete="address-level2"
                  error={errors.city?.message}
                  {...register('city')}
                />
              </div>
              <TextField
                label="Adresse"
                autoComplete="street-address"
                placeholder="Rue, numéro, immeuble, étage…"
                error={errors.address?.message}
                {...register('address')}
              />
              <TextareaField
                label="Note pour les artisans (facultatif)"
                rows={3}
                placeholder="Horaires de livraison, indications pour trouver l’adresse…"
                error={errors.notes?.message}
                {...register('notes')}
              />
            </CardContent>
          </Card>

          <div className="flex items-start gap-3 rounded-2xl border border-olive/30 bg-olive/10 p-4">
            <BanknoteIcon className="mt-0.5 size-6 shrink-0 text-olive" aria-hidden="true" />
            <div>
              <p className="font-semibold">Paiement à la livraison</p>
              <p className="text-sm text-muted-foreground">
                Vous réglez chaque colis en espèces à sa réception. Aucun paiement en ligne.
              </p>
            </div>
          </div>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border bg-card p-4 lg:sticky lg:top-24">
          <h2 className="font-sans text-base font-semibold tracking-normal">Récapitulatif</h2>
          {cart.isError ? (
            <ErrorState onRetry={cart.refetch} />
          ) : cart.isChecking ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <ul className="space-y-4">
              {cart.groups.map((group) => (
                <li key={group.artisanSlug} className="space-y-1 text-sm">
                  <p className="font-semibold">{group.artisanName}</p>
                  <ul className="space-y-1">
                    {group.lines.map((line) => (
                      <li key={line.productId} className="flex justify-between gap-2">
                        <span
                          className={line.problem ? 'text-destructive line-through' : undefined}
                        >
                          {line.quantity} × {line.name}
                        </span>
                        <span className="shrink-0">{formatPrice(line.lineTotal)}</span>
                      </li>
                    ))}
                    <li className="flex justify-between gap-2 text-muted-foreground">
                      <span>Livraison</span>
                      <span>{formatPrice(group.shippingFee)}</span>
                    </li>
                  </ul>
                </li>
              ))}
            </ul>
          )}
          <dl className="space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Sous-total</dt>
              <dd>{formatPrice(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Livraison ({parcels} colis)</dt>
              <dd>{formatPrice(cart.shippingTotal)}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <dt>Total à payer à la livraison</dt>
              <dd className="text-primary">{formatPrice(cart.total)}</dd>
            </div>
          </dl>
          {cart.hasProblems && (
            <Alert variant="destructive">
              <AlertDescription>
                Certains produits ne sont plus disponibles.{' '}
                <Link to="/panier" className="font-medium underline">
                  Revenir au panier
                </Link>
              </AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={placeOrder.isPending || cart.isChecking || cart.hasProblems || cart.isError}
          >
            {placeOrder.isPending && <Loader2Icon className="animate-spin" />}
            {placeOrder.isPending ? 'Envoi de la commande…' : 'Confirmer la commande'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            En confirmant, vous vous engagez à régler {formatPrice(cart.total)} à la réception.
          </p>
        </aside>
      </form>
    </div>
  )
}
