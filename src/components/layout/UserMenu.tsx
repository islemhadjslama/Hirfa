import { ChevronDownIcon, LogOutIcon, UserIcon } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { accountLinksFor, firstName } from '@/features/auth/account-links'
import { useSignOut } from '@/features/auth/useSignOut'
import { useProfile } from '@/hooks/useProfile'
import { USER_ROLE_LABELS } from '@/lib/labels'

/** Bouton « Connexion » pour un visiteur, menu du compte pour un utilisateur connecté. */
export function UserMenu() {
  const { profile, isLoading } = useProfile()
  const handleSignOut = useSignOut()

  if (isLoading) return <Skeleton className="h-9 w-24 rounded-lg" />

  if (!profile) {
    return (
      <>
        <Button asChild className="hidden sm:inline-flex">
          <Link to="/connexion">
            <UserIcon />
            Connexion
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild className="sm:hidden">
          <Link to="/connexion" aria-label="Connexion">
            <UserIcon />
          </Link>
        </Button>
      </>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label="Menu du compte">
          <UserIcon />
          <span className="hidden max-w-32 truncate sm:inline">{firstName(profile)}</span>
          <ChevronDownIcon className="hidden sm:inline" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="truncate">{profile.full_name}</p>
          <p className="text-xs font-normal text-muted-foreground">
            {USER_ROLE_LABELS[profile.role]}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accountLinksFor(profile).map((link) => (
          <DropdownMenuItem key={link.to} asChild>
            <Link to={link.to}>{link.label}</Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          <LogOutIcon />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
