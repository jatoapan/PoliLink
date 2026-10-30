import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/features/auth/auth-context'
import { AuthRouteError } from '@/features/auth/components/AuthRouteError'

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)

describe('auth route error', () => {
  it('allows retrying the session check', async () => {
    const refresh = vi.fn().mockResolvedValue(undefined)
    mockedUseAuth.mockReturnValue({
      user: null,
      status: 'error',
      error: new Error('Session unavailable'),
      isLoggingIn: false,
      isRegistering: false,
      isLoggingOut: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh,
    })
    const user = userEvent.setup()

    render(<AuthRouteError />)

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(refresh).toHaveBeenCalledOnce()
  })
})
