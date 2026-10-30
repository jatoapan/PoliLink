import {
  createContext,
  useEffect,
  useContext,
  type ReactNode,
} from 'react'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { authApi } from '@/features/auth/api/auth.api'
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '@/features/auth/model/auth.schemas'
import { subscribeToUnauthorized } from '@/shared/api/client'
import { ApiError } from '@/shared/errors/api-error'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error'

export type AuthContextValue = {
  user: AuthUser | null
  status: AuthStatus
  error: Error | null
  isLoggingIn: boolean
  isRegistering: boolean
  isLoggingOut: boolean
  login: (payload: LoginPayload) => Promise<AuthUser>
  register: (payload: RegisterPayload) => Promise<AuthUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export const authQueryKey = ['auth', 'me'] as const

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const sessionQuery = useQuery<AuthUser | null, Error>({
    queryKey: authQueryKey,
    queryFn: async (): Promise<AuthUser | null> => {
      try {
        return await authApi.me()
      } catch (error: unknown) {
        if (error instanceof ApiError && error.status === 401) return null
        throw error
      }
    },
    retry: false,
  })

  const loginMutation = useMutation<AuthUser, Error, LoginPayload>({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKey, user)
    },
  })

  const registerMutation = useMutation<AuthUser, Error, RegisterPayload>({
    mutationFn: authApi.register,
    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKey, user)
    },
  })

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: authApi.logout,
  })

  useEffect(() => {
    return subscribeToUnauthorized(() => {
      queryClient.setQueryData<AuthUser | null>(authQueryKey, null)
    })
  }, [queryClient])

  let status: AuthStatus

  if (sessionQuery.isPending) {
    status = 'loading'
  } else if (sessionQuery.isError) {
    status = 'error'
  } else if (sessionQuery.data) {
    status = 'authenticated'
  } else {
    status = 'anonymous'
  }

  const authenticatedUser = sessionQuery.data ?? null

  const value: AuthContextValue = {
    user: status === 'authenticated' ? authenticatedUser : null,
    status,
    error: sessionQuery.error,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: async () => {
      try {
        await logoutMutation.mutateAsync()
      } catch (error: unknown) {
        if (!(error instanceof ApiError && error.status === 401)) throw error
      } finally {
        queryClient.setQueryData<AuthUser | null>(authQueryKey, null)
      }
    },
    refresh: async () => {
      await sessionQuery.refetch()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) throw new Error('useAuth must be used inside AuthProvider')

  return context
}
