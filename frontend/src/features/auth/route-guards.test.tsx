import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { appRoutes } from '@/app/routes'
import { type AuthContextValue, useAuth } from '@/features/auth/auth-context'
import {
  buildLoginRedirect,
  RequireAdmin,
  RequireAnonymous,
  RequireAuth,
  RequireRole,
} from '@/features/auth/route-guards'

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)

const defaultAuthValue: AuthContextValue = {
  user: null,
  status: 'anonymous',
  error: null,
  isLoggingIn: false,
  isRegistering: false,
  isLoggingOut: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
}

function LocationProbe() {
  const location = useLocation()

  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  )
}

describe('auth route guards', () => {
  it('builds a login redirect preserving the current location', () => {
    expect(
      buildLoginRedirect({
        pathname: appRoutes.eventDetail(7),
        search: '?view=details',
        hash: '#registration',
      }),
    ).toBe(
      `${appRoutes.login}?redirect=%2Feventos%2F7%3Fview%3Ddetails%23registration`,
    )
  })

  it('redirects anonymous users to login', () => {
    mockedUseAuth.mockReturnValue({ ...defaultAuthValue, status: 'anonymous' })

    render(
      <MemoryRouter initialEntries={['/private?tab=events']}>
        <Routes>
          <Route
            path="/private"
            element={
              <RequireAuth>
                <div>private content</div>
              </RequireAuth>
            }
          />
          <Route path={appRoutes.login} element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('location')).toHaveTextContent(
      `${appRoutes.login}?redirect=%2Fprivate%3Ftab%3Devents`,
    )
  })

  it('redirects authenticated users away from anonymous-only routes', () => {
    mockedUseAuth.mockReturnValue({
      ...defaultAuthValue,
      status: 'authenticated',
      user: {
        id: 7,
        first_name: 'Ana',
        last_name: 'Torres',
        email: 'ana@espol.edu.ec',
        is_admin: false,
        community_memberships: [],
      },
    })

    render(
      <MemoryRouter initialEntries={[appRoutes.login]}>
        <Routes>
          <Route
            path={appRoutes.login}
            element={
              <RequireAnonymous>
                <div>login content</div>
              </RequireAnonymous>
            }
          />
          <Route path="/" element={<div>home content</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('home content')).toBeInTheDocument()
  })

  it('blocks users without the required role', () => {
    mockedUseAuth.mockReturnValue({
      ...defaultAuthValue,
      status: 'authenticated',
      user: {
        id: 7,
        first_name: 'Ana',
        last_name: 'Torres',
        email: 'ana@espol.edu.ec',
        is_admin: false,
        community_memberships: [],
      },
    })

    render(
      <MemoryRouter initialEntries={[appRoutes.myCommunities]}>
        <Routes>
          <Route
            path={appRoutes.myCommunities}
            element={
              <RequireRole requiredRole="organizer">
                <div>organizer content</div>
              </RequireRole>
            }
          />
          <Route path="/" element={<div>home content</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('home content')).toBeInTheDocument()
  })

  it('redirects anonymous users from organizer routes to login', () => {
    mockedUseAuth.mockReturnValue({ ...defaultAuthValue, status: 'anonymous' })

    render(
      <MemoryRouter initialEntries={[appRoutes.organize]}>
        <Routes>
          <Route
            path={appRoutes.organize}
            element={
              <RequireRole requiredRole="organizer">
                <div>organizer content</div>
              </RequireRole>
            }
          />
          <Route path={appRoutes.login} element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('location')).toHaveTextContent(
      `${appRoutes.login}?redirect=%2Forganizar`,
    )
  })

  it('allows organizers to access organizer routes', () => {
    mockedUseAuth.mockReturnValue({
      ...defaultAuthValue,
      status: 'authenticated',
      user: {
        id: 7,
        first_name: 'Ana',
        last_name: 'Torres',
        email: 'ana@espol.edu.ec',
        is_admin: false,
        community_memberships: [
          {
            community: { id: 1, name: 'TAWS', slug: 'taws' },
            role: { code: 'organizer', name: 'Organizer' },
            status: { code: 'active', name: 'Active' },
            requested_at: null,
            reviewed_at: null,
          },
        ],
      },
    })

    render(
      <MemoryRouter initialEntries={[appRoutes.myCommunities]}>
        <Routes>
          <Route
            path={appRoutes.myCommunities}
            element={
              <RequireRole requiredRole="organizer">
                <div>organizer content</div>
              </RequireRole>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('organizer content')).toBeInTheDocument()
  })

  it('blocks non-admin users from admin routes', () => {
    mockedUseAuth.mockReturnValue({
      ...defaultAuthValue,
      status: 'authenticated',
      user: {
        id: 7,
        first_name: 'Ana',
        last_name: 'Torres',
        email: 'ana@espol.edu.ec',
        is_admin: false,
        community_memberships: [],
      },
    })

    render(
      <MemoryRouter initialEntries={[appRoutes.admin]}>
        <Routes>
          <Route
            path={appRoutes.admin}
            element={
              <RequireAdmin>
                <div>admin content</div>
              </RequireAdmin>
            }
          />
          <Route path="/" element={<div>home content</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('home content')).toBeInTheDocument()
  })

  it('allows admins to access admin routes', () => {
    mockedUseAuth.mockReturnValue({
      ...defaultAuthValue,
      status: 'authenticated',
      user: {
        id: 9,
        first_name: 'Luis',
        last_name: 'Paredes',
        email: 'luis@espol.edu.ec',
        is_admin: true,
        community_memberships: [],
      },
    })

    render(
      <MemoryRouter initialEntries={[appRoutes.admin]}>
        <Routes>
          <Route
            path={appRoutes.admin}
            element={
              <RequireAdmin>
                <div>admin content</div>
              </RequireAdmin>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('admin content')).toBeInTheDocument()
  })
})
