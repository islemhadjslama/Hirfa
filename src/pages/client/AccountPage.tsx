import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { SelectField } from '@/components/common/SelectField'
import { TextField } from '@/components/common/TextField'
import { AccountNav } from '@/components/layout/AccountNav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useChangePassword, useUpdateAccount } from '@/features/account/api'
import {
  accountSchema,
  passwordSchema,
  type AccountValues,
  type PasswordValues,
} from '@/features/account/schemas'
import type { Profile } from '@/features/auth/api'
import { useProfile } from '@/hooks/useProfile'
import { GOVERNORATES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'

const GOVERNORATE_OPTIONS = GOVERNORATES.map((name) => ({ value: name, label: name }))

function formatPhone(value: string | null): string {
  const digits = (value ?? '').replace(/\D/g, '')
  return digits.length === 8
    ? `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
    : (value ?? '')
}

function ProfileForm({ profile }: { profile: Profile }) {
  const update = useUpdateAccount()
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      fullName: profile.full_name,
      phone: formatPhone(profile.phone),
      governorate: profile.governorate ?? '',
      city: profile.city ?? '',
      address: profile.address ?? '',
    },
  })

  const onSubmit = handleSubmit((values) =>
    update.mutate(
      { userId: profile.id, values },
      {
        onSuccess: () => toast.success('Vos informations ont été enregistrées.'),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    ),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-lg font-semibold">Informations personnelles</h2>
        </CardTitle>
        <CardDescription>
          L’adresse par défaut pré-remplit le formulaire de commande.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={onSubmit} className="space-y-4">
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
            value={profile.email ?? ''}
            readOnly
            disabled
            description="L’adresse email de connexion ne peut pas être modifiée ici."
          />
          <h3 className="border-t pt-4 font-sans text-sm font-semibold tracking-normal text-muted-foreground">
            Adresse de livraison par défaut
          </h3>
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
          <div className="flex justify-end">
            <Button type="submit" disabled={update.isPending || !isDirty}>
              {update.isPending && <Loader2Icon className="animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function PasswordForm({ email }: { email: string }) {
  const change = useChangePassword()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit((values) =>
    change.mutate(
      { email, currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          toast.success('Votre mot de passe a été modifié.')
          reset()
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    ),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-lg font-semibold">Mot de passe</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={onSubmit} className="space-y-4">
          <TextField
            label="Mot de passe actuel"
            type="password"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Nouveau mot de passe"
              type="password"
              autoComplete="new-password"
              description="8 caractères minimum."
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <TextField
              label="Confirmer le nouveau mot de passe"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="outline" disabled={change.isPending}>
              {change.isPending && <Loader2Icon className="animate-spin" />}
              Changer le mot de passe
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/** CLI-1 — Profil, adresse de livraison par défaut et mot de passe. */
export default function AccountPage() {
  const { profile } = useProfile()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-4 text-3xl font-semibold">Mon compte</h1>
      <AccountNav />
      {profile && (
        <div className="space-y-6">
          {/* `key` : le formulaire repart des données enregistrées après chaque sauvegarde */}
          <ProfileForm key={profile.updated_at} profile={profile} />
          <PasswordForm email={profile.email ?? ''} />
        </div>
      )}
    </div>
  )
}
