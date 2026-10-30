import { ChevronDown, LogOut } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/features/auth/auth-context'
import {
  getRoleLabel,
  getUserDisplayName,
} from '@/features/auth/model/auth-helpers'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

export function UserMenu() {
  const { isLoggingOut, logout, user } = useAuth()
  const [error, setError] = useState<unknown>(null)

  if (!user) return null

  const displayName = getUserDisplayName(user)

  const handleLogout = async () => {
    setError(null)

    try {
      await logout()
    } catch (logoutError: unknown) {
      setError(logoutError)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`Abrir menú de ${displayName}`}
          className="max-w-44"
          size="sm"
          type="button"
          variant="ghost"
        >
          <span className="truncate">{user.first_name}</span>
          <ChevronDown aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <p className="truncate text-foreground">{displayName}</p>
          <p className="mt-1 truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {user.is_admin && <Badge variant="outline">Administrador</Badge>}
            {user.community_memberships
              .filter((membership) => membership.status.code === 'active')
              .map((membership) => (
                <Badge
                  key={`${membership.community.id}-${membership.role.code}`}
                  variant="outline"
                >
                  {getRoleLabel(membership.role.code)} ·{' '}
                  {membership.community.name}
                </Badge>
              ))}
            {!user.is_admin && user.community_memberships.length === 0 && (
              <Badge variant="outline">Miembro</Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {error !== null && (
          <ApiErrorFeedback
            error={error}
            fallback="No pudimos cerrar sesión. Intenta nuevamente."
            variant="destructive"
          />
        )}
        <DropdownMenuItem
          disabled={isLoggingOut}
          onSelect={(event) => {
            event.preventDefault()
            void handleLogout()
          }}
        >
          <LogOut aria-hidden="true" />
          {isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
