import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { AuthProvider, useAuth } from '@/features/auth/auth-context'
import { server } from '@/test/server'

const backendUrl = 'http://localhost:8000'

const authenticatedUser = {
  id: 7,
  first_name: 'Ana',
  last_name: 'Torres',
  email: 'ana@espol.edu.ec',
  is_admin: false,
  community_memberships: [],
}

function AuthProbe() {
  const {
    isLoggingIn,
    isLoggingOut,
    isRegistering,
    login,
    logout,
    register,
    status,
    user,
  } = useAuth()

  return (
    <div>
      <output data-testid="status">{status}</output>
      <output data-testid="email">{user?.email ?? ''}</output>
      <output data-testid="login-state">{String(isLoggingIn)}</output>
      <output data-testid="register-state">{String(isRegistering)}</output>
      <output data-testid="logout-state">{String(isLoggingOut)}</output>
      <button
        type="button"
        onClick={() =>
          void login({ email: 'ana@espol.edu.ec', password: 'password123' })
        }
      >
        Login
      </button>
      <button
        type="button"
        onClick={() =>
          void register({
            email: 'ana@espol.edu.ec',
            first_name: 'Ana',
            last_name: 'Torres',
            password: 'password123',
            password_confirmation: 'password123',
          })
        }
      >
        Register
      </button>
      <button type="button" onClick={() => void logout()}>
        Logout
      </button>
    </div>
  )
}

function renderAuthProbe() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

function csrfHandler() {
  return http.get(`${backendUrl}/sanctum/csrf-cookie`, () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    return new HttpResponse(null, { status: 204 })
  })
}

describe('AuthProvider', () => {
  it('resolves an unauthenticated session as anonymous', async () => {
    renderAuthProbe()

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
    })
  })

  it('updates the session after a successful login', async () => {
    server.use(
      csrfHandler(),
      http.post(`${backendUrl}/api/auth/login`, () =>
        HttpResponse.json({ data: authenticatedUser }),
      ),
    )

    const user = userEvent.setup()
    renderAuthProbe()

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
    })

    await user.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('email')).toHaveTextContent('ana@espol.edu.ec')
    })
  })

  it('clears the session after logout', async () => {
    server.use(
      http.get(`${backendUrl}/api/auth/me`, () =>
        HttpResponse.json({ data: authenticatedUser }),
      ),
      csrfHandler(),
      http.delete(
        `${backendUrl}/api/auth/logout`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    )

    const user = userEvent.setup()
    renderAuthProbe()

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    })

    await user.click(screen.getByRole('button', { name: 'Logout' }))

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
      expect(screen.getByTestId('email')).toHaveTextContent('')
    })
  })

  it('updates the session after a successful registration', async () => {
    server.use(
      csrfHandler(),
      http.post(`${backendUrl}/api/auth/register`, () =>
        HttpResponse.json({ data: authenticatedUser }, { status: 201 }),
      ),
    )

    const user = userEvent.setup()
    renderAuthProbe()

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
    })

    await user.click(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('email')).toHaveTextContent('ana@espol.edu.ec')
    })
  })
})
