import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppLayout } from '@/app/layouts/AppLayout'
import { appRoutes } from '@/app/routes'
import { type AuthContextValue, useAuth } from '@/features/auth/auth-context'
import { UserMenu } from '@/features/auth/components/UserMenu'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ApiError } from '@/shared/errors/api-error'

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/shared/ui/theme-toggle', () => ({
  ThemeToggle: () => <button type="button">Tema</button>,
}))

const mockedUseAuth = vi.mocked(useAuth)

const authenticatedUser = {
  id: 7,
  first_name: 'Ana',
  last_name: 'Torres',
  email: 'ana@espol.edu.ec',
  is_admin: false,
  community_memberships: [],
}

function createAuthValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    user: null,
    status: 'anonymous',
    error: null,
    isLoggingIn: false,
    isRegistering: false,
    isLoggingOut: false,
    login: vi.fn(async () => authenticatedUser),
    register: vi.fn(async () => authenticatedUser),
    logout: vi.fn(async () => undefined),
    refresh: vi.fn(async () => undefined),
    ...overrides,
  }
}

function LocationProbe() {
  const location = useLocation()

  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
      {location.hash}
    </output>
  )
}

function renderAuthPage(page: ReactNode, initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path={appRoutes.login} element={page} />
        <Route path={appRoutes.register} element={<RegisterPage />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('authentication UI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseAuth.mockReturnValue(createAuthValue())
  })

  it('logs in and navigates to a safe internal redirect', async () => {
    const login = vi.fn(async () => authenticatedUser)
    mockedUseAuth.mockReturnValue(createAuthValue({ login }))

    const user = userEvent.setup()
    renderAuthPage(
      <LoginPage />,
      `${appRoutes.login}?redirect=${encodeURIComponent(`${appRoutes.eventDetail(7)}?view=details#registration`)}`,
    )

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'ana@espol.edu.ec',
    )
    await user.type(screen.getByLabelText('Contraseña'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'ana@espol.edu.ec',
        password: 'password123',
      })
    })
    expect(await screen.findByTestId('location')).toHaveTextContent(
      `${appRoutes.eventDetail(7)}?view=details#registration`,
    )
  })

  it('rejects non-ESPOL email data before calling the auth API', async () => {
    const login = vi.fn(async () => authenticatedUser)
    mockedUseAuth.mockReturnValue(createAuthValue({ login }))

    const user = userEvent.setup()
    renderAuthPage(<LoginPage />, appRoutes.login)

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'ana@gmail.com',
    )
    await user.type(screen.getByLabelText('Contraseña'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(login).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('renders backend field errors and a summary message', async () => {
    const login = vi.fn().mockRejectedValue(
      new ApiError(422, {
        errors: { email: ['Ese correo ya está registrado.'] },
      }),
    )
    mockedUseAuth.mockReturnValue(createAuthValue({ login }))

    const user = userEvent.setup()
    renderAuthPage(<LoginPage />, appRoutes.login)

    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'ana@espol.edu.ec',
    )
    await user.type(screen.getByLabelText('Contraseña'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(
      await screen.findByText('Ese correo ya está registrado.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Revisa los datos ingresados.')).toBeInTheDocument()
  })

  it('registers a student account and returns to the default route', async () => {
    const register = vi.fn(async () => authenticatedUser)
    mockedUseAuth.mockReturnValue(createAuthValue({ register }))

    const user = userEvent.setup()
    renderAuthPage(<RegisterPage />, appRoutes.register)

    await user.type(screen.getByLabelText('Nombres'), 'Ana')
    await user.type(screen.getByLabelText('Apellidos'), 'Torres')
    await user.type(
      screen.getByLabelText('Correo electrónico'),
      'ana@espol.edu.ec',
    )
    await user.type(screen.getByLabelText('Contraseña'), 'password123')
    await user.type(
      screen.getByLabelText('Repite tu contraseña'),
      'password123',
    )
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        email: 'ana@espol.edu.ec',
        first_name: 'Ana',
        last_name: 'Torres',
        password: 'password123',
        password_confirmation: 'password123',
      })
    })
    expect(await screen.findByTestId('location')).toHaveTextContent('/')
  })
})

describe('authenticated navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows auth actions to anonymous users in the application header', () => {
    mockedUseAuth.mockReturnValue(createAuthValue())

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AppLayout />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Crear cuenta' }),
    ).toBeInTheDocument()
  })

  it('shows the user menu and logs out authenticated users', async () => {
    const logout = vi.fn(async () => undefined)
    mockedUseAuth.mockReturnValue(
      createAuthValue({
        logout,
        status: 'authenticated',
        user: authenticatedUser,
      }),
    )

    const user = userEvent.setup()
    render(<UserMenu />)

    await user.click(
      screen.getByRole('button', { name: 'Abrir menú de Ana Torres' }),
    )
    await user.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }))

    await waitFor(() => expect(logout).toHaveBeenCalledOnce())
  })

  it('keeps logout errors visible in the user menu', async () => {
    const logout = vi
      .fn()
      .mockRejectedValue(
        new ApiError(500, { message: 'El servidor no responde.' }),
      )
    mockedUseAuth.mockReturnValue(
      createAuthValue({
        logout,
        status: 'authenticated',
        user: authenticatedUser,
      }),
    )

    const user = userEvent.setup()
    render(<UserMenu />)

    await user.click(
      screen.getByRole('button', { name: 'Abrir menú de Ana Torres' }),
    )
    await user.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }))

    expect(
      await screen.findByText(
        'PoliLink no está disponible en este momento. Intenta nuevamente más tarde.',
      ),
    ).toBeInTheDocument()
  })
})
