import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { AuthCard } from '@/components/common/AuthCard'
import { EmailSentNotice } from '@/components/common/EmailSentNotice'
import { TextField } from '@/components/common/TextField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useSignUp } from '@/features/auth/api'
import { safeRedirect } from '@/features/auth/redirects'
import {
  normalizePhone,
  registerClientSchema,
  type RegisterClientValues,
} from '@/features/auth/schemas'
import { getErrorMessage } from '@/lib/errors'

/** AUTH-1 — Inscription client. La redirection est faite par GuestOnlyRoute. */
export default function RegisterClientPage() {
  const [searchParams] = useSearchParams()
  const redirect = safeRedirect(searchParams.get('redirect'))
  const signUp = useSignUp(({ needsEmailConfirmation }) => {
    if (!needsEmailConfirmation) toast.success('Bienvenue sur Hirfa !')
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterClientValues>({
    resolver: zodResolver(registerClientSchema),
    defaultValues: { fullName: '', email: '', phone: '', password: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit((values) =>
    signUp.mutate({
      email: values.email,
      password: values.password,
      metadata: {
        role: 'client',
        full_name: values.fullName,
        phone: normalizePhone(values.phone),
      },
    }),
  )

  const loginLink = redirect ? `/connexion?redirect=${encodeURIComponent(redirect)}` : '/connexion'

  return (
    <AuthCard
      title="Créer un compte client"
      description="Commandez auprès des artisans et suivez vos commandes."
      footer={
        <p>
          Déjà inscrit ?{' '}
          <Link to={loginLink} className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      }
    >
      {signUp.data?.needsEmailConfirmation ? (
        <EmailSentNotice title="Vérifiez votre boîte mail">
          Un lien de confirmation vous a été envoyé. Cliquez dessus pour activer votre compte, puis
          connectez-vous.
        </EmailSentNotice>
      ) : (
        <form noValidate className="space-y-4" onSubmit={onSubmit}>
          {signUp.isError && (
            <Alert variant="destructive">
              <AlertDescription>{getErrorMessage(signUp.error)}</AlertDescription>
            </Alert>
          )}
          <TextField
            label="Nom complet"
            autoComplete="name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <TextField
            label="Adresse email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
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
          <Button type="submit" size="lg" className="w-full" disabled={signUp.isPending}>
            {signUp.isPending && <Loader2Icon className="animate-spin" />}
            Créer mon compte
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
