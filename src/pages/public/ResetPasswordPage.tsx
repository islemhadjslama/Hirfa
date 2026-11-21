import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { AuthCard } from '@/components/common/AuthCard'
import { PageLoader } from '@/components/common/PageLoader'
import { TextField } from '@/components/common/TextField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useUpdatePassword } from '@/features/auth/api'
import { homePathFor } from '@/features/auth/redirects'
import { resetPasswordSchema, type ResetPasswordValues } from '@/features/auth/schemas'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { getErrorMessage } from '@/lib/errors'

/**
 * AUTH-4 — Page ouverte depuis le lien reçu par email. Supabase lit le jeton
 * dans l'URL et ouvre une session temporaire, qui permet de changer le mot de passe.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { session, initialized } = useAuth()
  const { profile } = useProfile()
  const update = useUpdatePassword()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  if (!initialized) return <PageLoader />

  if (!session) {
    return (
      <AuthCard title="Lien invalide ou expiré">
        <p className="text-sm text-muted-foreground">
          Ce lien de réinitialisation n’est plus valide. Faites une nouvelle demande.
        </p>
        <Button asChild className="w-full">
          <Link to="/mot-de-passe-oublie">Recevoir un nouveau lien</Link>
        </Button>
      </AuthCard>
    )
  }

  const onSubmit = handleSubmit((values) =>
    update.mutate(values.password, {
      onSuccess: () => {
        toast.success('Votre mot de passe a été modifié.')
        navigate(profile ? homePathFor(profile) : '/', { replace: true })
      },
    }),
  )

  return (
    <AuthCard title="Nouveau mot de passe" description="Choisissez votre nouveau mot de passe.">
      <form noValidate className="space-y-4" onSubmit={onSubmit}>
        {update.isError && (
          <Alert variant="destructive">
            <AlertDescription>{getErrorMessage(update.error)}</AlertDescription>
          </Alert>
        )}
        <TextField
          label="Nouveau mot de passe"
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
        <Button type="submit" size="lg" className="w-full" disabled={update.isPending}>
          {update.isPending && <Loader2Icon className="animate-spin" />}
          Enregistrer
        </Button>
      </form>
    </AuthCard>
  )
}
