import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { AppLayout } from '@/app/layouts/AppLayout'
import { appRoutes } from '@/app/routes'
import { type AuthContextValue, useAuth } from '@/features/auth/auth-context'

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

describe('application layout community navigation', () => {
  it('shows the community directory link to anonymous visitors', () => {
    mockedUseAuth.mockReturnValue(defaultAuthValue)

    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: 'Comunidades' }),
    ).toHaveAttribute('href', appRoutes.communities)
  })

  it('shows the managed communities link to organizers', () => {
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
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: 'Mis comunidades' }),
    ).toHaveAttribute('href', appRoutes.myCommunities)
    expect(screen.getByRole('link', { name: 'Mis eventos' })).toHaveAttribute(
      'href',
      appRoutes.myEvents,
    )
  })

  it('shows organizer links inside the compact mobile menu', async () => {
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

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))

    const menu = await screen.findByRole('dialog')
    expect(
      within(menu).getByRole('link', { name: 'Mis eventos' }),
    ).toHaveAttribute('href', appRoutes.myEvents)
  })

  it('shows the community onboarding link to students', () => {
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
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: 'Organiza una comunidad' }),
    ).toHaveAttribute('href', appRoutes.organize)
  })

  it('shows the administration link to admins only', () => {
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
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: 'Administración' }),
    ).toHaveAttribute('href', appRoutes.admin)
  })

  it('hides the administration link from non-admin users', () => {
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
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    )

    expect(
      screen.queryByRole('link', { name: 'Administración' }),
    ).not.toBeInTheDocument()
  })
})
