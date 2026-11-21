import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { AuthCard } from '@/components/common/AuthCard'
import { EmailSentNotice } from '@/components/common/EmailSentNotice'
import { SelectField } from '@/components/common/SelectField'
import { TextField } from '@/components/common/TextField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useSignUp } from '@/features/auth/api'
import {
  normalizePhone,
  registerArtisanSchema,
  type RegisterArtisanValues,
} from '@/features/auth/schemas'
import { useCategories } from '@/features/catalog/api'
import { GOVERNORATES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'

const GOVERNORATE_OPTIONS = GOVERNORATES.map((name) => ({ value: name, label: name }))

/** AUTH-2 — Inscription artisan : compte créé en statut `pending`. */
export default function RegisterArtisanPage() {
  const signUp = useSignUp(({ needsEmailConfirmation }) => {
    if (!needsEmailConfirmation)
      toast.success('Compte créé ! Votre boutique est en attente de validation.')
  })
  const categories = useCategories()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterArtisanValues>({
    resolver: zodResolver(registerArtisanSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      shopName: '',
      specialtyCategoryId: '',
      governorate: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = handleSubmit((values) =>
    signUp.mutate({
      email: values.email,
      password: values.password,
      metadata: {
        role: 'artisan',
        full_name: values.fullName,
        phone: normalizePhone(values.phone),
        shop_name: values.shopName,
        specialty_category_id: values.specialtyCategoryId,
        governorate: values.governorate,
      },
    }),
  )

  const categoryOptions = (categories.data ?? []).map((category) => ({
    value: String(category.id),
    label: category.name,
  }))

  return (
    <AuthCard
      wide
      title="Ouvrir ma boutique"
      description="Créez gratuitement votre boutique d’artisan. Un administrateur la validera avant que vous puissiez publier vos produits."
      footer={
        <p>
          J’ai déjà un compte :{' '}
          <Link to="/connexion" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      }
    >
      {signUp.data?.needsEmailConfirmation ? (
        <EmailSentNotice title="Vérifiez votre boîte mail">
          Un lien de confirmation vous a été envoyé. Une fois votre email confirmé, connectez-vous
          pour suivre la validation de votre boutique.
        </EmailSentNotice>
      ) : (
        <form noValidate className="space-y-4" onSubmit={onSubmit}>
          {signUp.isError && (
            <Alert variant="destructive">
              <AlertDescription>{getErrorMessage(signUp.error)}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Nom complet"
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
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>
          <TextField
            label="Adresse email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <h2 className="border-t pt-4 font-sans text-sm font-semibold tracking-normal text-muted-foreground">
            Votre boutique
          </h2>

          <TextField
            label="Nom de la boutique"
            placeholder="Ex. Dar El Fekhar"
            autoComplete="organization"
            error={errors.shopName?.message}
            {...register('shopName')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Spécialité"
              placeholder={categories.isPending ? 'Chargement…' : 'Choisir une catégorie'}
              options={categoryOptions}
              disabled={categories.isPending}
              error={
                errors.specialtyCategoryId?.message ??
                (categories.isError ? 'Impossible de charger les catégories.' : undefined)
              }
              {...register('specialtyCategoryId')}
            />
            <SelectField
              label="Gouvernorat"
              placeholder="Choisir un gouvernorat"
              options={GOVERNORATE_OPTIONS}
              error={errors.governorate?.message}
              {...register('governorate')}
            />
          </div>

          <h2 className="border-t pt-4 font-sans text-sm font-semibold tracking-normal text-muted-foreground">
            Sécurité
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Mot de passe"
              type="password"
              autoComplete="new-password"
              description="8 caractères minimum."
              error={errors.password?.message}
              {...register('password')}
            />
            <TextField
              label="Confirmer le mot de passe"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={signUp.isPending}>
            {signUp.isPending && <Loader2Icon className="animate-spin" />}
            Créer ma boutique
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
