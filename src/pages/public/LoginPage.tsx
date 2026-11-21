import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'

import { AuthCard } from '@/components/common/AuthCard'
import { TextField } from '@/components/common/TextField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useSignIn } from '@/features/auth/api'
import { safeRedirect } from '@/features/auth/redirects'
import { loginSchema, type LoginValues } from '@/features/auth/schemas'
import { getErrorMessage } from '@/lib/errors'

/** AUTH-3 — La redirection après succès est faite par GuestOnlyRoute. */
export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const redirect = safeRedirect(searchParams.get('redirect'))
  const signIn = useSignIn()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const withRedirect = (path: string) =>
    redirect ? `${path}?redirect=${encodeURIComponent(redirect)}` : path

  return (
    <AuthCard
      title="Connexion"
      description="Accédez à votre compte client, artisan ou administrateur."
      footer={
        <>
          <p>
            Pas encore de compte ?{' '}
            <Link
              to={withRedirect('/inscription')}
              className="font-medium text-primary hover:underline"
            >
              Créer un compte client
            </Link>
          </p>
          <p>
            Vous êtes artisan ?{' '}
            <Link to="/artisan/inscription" className="font-medium text-primary hover:underline">
              Ouvrir ma boutique
            </Link>
          </p>
        </>
      }
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit((values) => signIn.mutate(values))}
      >
        {signIn.isError && (
          <Alert variant="destructive">
            <AlertDescription>{getErrorMessage(signIn.error)}</AlertDescription>
          </Alert>
        )}
        <TextField
          label="Adresse email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="text-right text-sm">
          <Link to="/mot-de-passe-oublie" className="text-sidi-bou hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={signIn.isPending}>
          {signIn.isPending && <Loader2Icon className="animate-spin" />}
          Se connecter
        </Button>
      </form>
    </AuthCard>
  )
}
