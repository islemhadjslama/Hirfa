import { AuthError } from '@supabase/supabase-js'

const GENERIC = 'Une erreur est survenue. Veuillez réessayer.'
const NETWORK = 'Connexion impossible. Vérifiez votre connexion internet puis réessayez.'

/** Codes d'erreur Supabase Auth → messages français. */
const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email ou mot de passe incorrect.',
  user_already_exists: 'Un compte existe déjà avec cet email.',
  email_exists: 'Un compte existe déjà avec cet email.',
  email_not_confirmed:
    'Confirmez votre adresse email avant de vous connecter (vérifiez votre boîte de réception).',
  weak_password: 'Mot de passe trop faible : choisissez-en un plus long et plus varié.',
  same_password: 'Le nouveau mot de passe doit être différent de l’ancien.',
  over_email_send_rate_limit: 'Trop d’emails envoyés. Réessayez dans quelques minutes.',
  over_request_rate_limit: 'Trop de tentatives. Réessayez dans quelques minutes.',
  email_address_invalid: 'Adresse email invalide.',
  signup_disabled: 'Les inscriptions sont temporairement fermées.',
  user_banned: 'Votre compte a été désactivé. Contactez l’administrateur.',
  session_not_found: 'Votre session a expiré. Reconnectez-vous.',
  refresh_token_not_found: 'Votre session a expiré. Reconnectez-vous.',
  otp_expired: 'Ce lien a expiré. Faites une nouvelle demande.',
}

type PostgrestLikeError = { code: string; message: string; details: unknown }

function isPostgrestError(error: unknown): error is PostgrestLikeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  )
}

/**
 * Message d'erreur lisible (en français) pour l'utilisateur.
 * Les exceptions levées par nos fonctions SQL sont déjà en français et sont
 * affichées telles quelles ; les erreurs natives (anglaises) sont traduites.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    if (error.code && AUTH_MESSAGES[error.code]) return AUTH_MESSAGES[error.code]
    if (error.name === 'AuthRetryableFetchError' || error.status === 0) return NETWORK
    return GENERIC
  }

  if (isPostgrestError(error)) {
    const { code, message } = error
    if (/row-level security|permission denied/i.test(message)) return 'Action non autorisée.'
    if (code === '23505') return 'Cet élément existe déjà.'
    if (/violates check constraint/i.test(message)) return 'Une valeur saisie est invalide.'
    if (/violates foreign key/i.test(message)) return 'Cet élément est utilisé ailleurs.'
    if (code === 'PGRST116') return 'Élément introuvable.'
    if (/^(P0|42501|22023|23514|23503)/.test(code)) return message
    return GENERIC
  }

  if (error instanceof TypeError && /fetch/i.test(error.message)) return NETWORK
  if (error instanceof Error && error.message) return error.message
  return GENERIC
}
