import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'

import { AuthCard } from '@/components/common/AuthCard'
import { EmailSentNotice } from '@/components/common/EmailSentNotice'
import { TextField } from '@/components/common/TextField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useRequestPasswordReset } from '@/features/auth/api'
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/features/auth/schemas'
import { getErrorMessage } from '@/lib/errors'

/** AUTH-4 — Demande de réinitialisation par email. */
export default function ForgotPasswordPage() {
  const reset = useRequestPasswordReset()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  return (
    <AuthCard
      title="Mot de passe oublié"
      description="Indiquez votre email : nous vous enverrons un lien pour choisir un nouveau mot de passe."
      footer={
        <Link to="/connexion" className="font-medium text-primary hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      {reset.isSuccess ? (
        // Même message que le compte existe ou non (pas de fuite d'information).
        <EmailSentNotice title="Email envoyé">
          Si un compte existe avec l’adresse <strong>{reset.variables}</strong>, vous recevrez un
          lien de réinitialisation dans quelques minutes. Pensez à vérifier vos courriers
          indésirables.
        </EmailSentNotice>
      ) : (
        <form
          noValidate
          className="space-y-4"
          onSubmit={handleSubmit((values) => reset.mutate(values.email))}
        >
          {reset.isError && (
            <Alert variant="destructive">
              <AlertDescription>{getErrorMessage(reset.error)}</AlertDescription>
            </Alert>
          )}
          <TextField
            label="Adresse email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" size="lg" className="w-full" disabled={reset.isPending}>
            {reset.isPending && <Loader2Icon className="animate-spin" />}
            Envoyer le lien
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
