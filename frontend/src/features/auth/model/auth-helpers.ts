import { type AuthRoute, appRoutes } from '@/app/routes'
import type { AuthUser, RoleCode } from '@/features/auth/model/auth.schemas'

export function hasRole(user: AuthUser | null, role: RoleCode): boolean {
  return (
    user?.community_memberships.some(
      (membership) =>
        membership.status.code === 'active' && membership.role.code === role,
    ) ?? false
  )
}

export function getUserDisplayName(user: AuthUser): string {
  return `${user.first_name} ${user.last_name}`.trim()
}

export function getRoleLabel(role: RoleCode): string {
  if (role === 'organizer') return 'Organizador'
  if (role === 'tutor') return 'Tutor'

  return 'Miembro'
}

export function getSafeRedirect(value: string | null | undefined): string {
  if (!value?.startsWith('/') || value.startsWith('//')) return '/'

  try {
    const candidate = new URL(value, 'http://polilink.local')

    if (
      candidate.origin !== 'http://polilink.local' ||
      candidate.pathname === appRoutes.login ||
      candidate.pathname === appRoutes.register
    ) {
      return '/'
    }

    return `${candidate.pathname}${candidate.search}${candidate.hash}`
  } catch {
    return '/'
  }
}

export function buildAuthPath(
  path: AuthRoute,
  redirect: string | null | undefined,
): string {
  const safeRedirect = getSafeRedirect(redirect)

  if (safeRedirect === '/') return path

  return `${path}?${new URLSearchParams({ redirect: safeRedirect }).toString()}`
}
