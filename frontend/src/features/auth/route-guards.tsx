import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import { appRoutes } from '@/app/routes'
import { useAuth } from '@/features/auth/auth-context'
import type { RoleCode } from '@/features/auth/model/auth.schemas'
import { hasRole } from '@/features/auth/model/auth-helpers'

type GuardProps = {
  children: ReactNode
  loadingFallback?: ReactNode
  errorFallback?: ReactNode
}

type RedirectLocation = {
  pathname: string
  search: string
  hash: string
}

export function buildLoginRedirect(location: RedirectLocation): string {
  const redirect = `${location.pathname}${location.search}${location.hash}`
  const search = new URLSearchParams({ redirect }).toString()

  return `${appRoutes.login}?${search}`
}

export function RequireAuth({
  children,
  loadingFallback = null,
  errorFallback = null,
}: GuardProps) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <>{loadingFallback}</>
  if (status === 'error') return <>{errorFallback}</>

  if (status === 'anonymous') {
    return <Navigate replace to={buildLoginRedirect(location)} />
  }

  return <>{children}</>
}

export function RequireAnonymous({
  children,
  loadingFallback = null,
  errorFallback = null,
}: GuardProps) {
  const { status } = useAuth()

  if (status === 'loading') return <>{loadingFallback}</>
  if (status === 'error') return <>{errorFallback ?? children}</>

  if (status === 'authenticated') {
    return <Navigate replace to="/" />
  }

  return <>{children}</>
}

export function RequireRole({
  children,
  requiredRole,
  loadingFallback = null,
  errorFallback = null,
}: GuardProps & { requiredRole: RoleCode }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <>{loadingFallback}</>
  if (status === 'error') return <>{errorFallback}</>

  if (status === 'anonymous') {
    return <Navigate replace to={buildLoginRedirect(location)} />
  }

  if (!hasRole(user, requiredRole)) return <Navigate replace to="/" />

  return <>{children}</>
}

export function RequireAdmin({
  children,
  loadingFallback = null,
  errorFallback = null,
}: GuardProps) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <>{loadingFallback}</>
  if (status === 'error') return <>{errorFallback}</>

  if (status === 'anonymous') {
    return <Navigate replace to={buildLoginRedirect(location)} />
  }

  if (!user?.is_admin) return <Navigate replace to="/" />

  return <>{children}</>
}
