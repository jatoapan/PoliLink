import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { appRoutes } from '@/app/routes'
import { type AuthContextValue, useAuth } from '@/features/auth/auth-context'
import { OrganizePage } from '@/features/organizer/pages/OrganizePage'

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)

const defaultAuthValue: AuthContextValue = {
  user: null,
  status: 'authenticated',
  error: null,
  isLoggingIn: false,
  isRegistering: false,
  isLoggingOut: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
}

describe('organize page', () => {
  it('guides a student to register a new community', () => {
    mockedUseAuth.mockReturnValue({
      ...defaultAuthValue,
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
        <OrganizePage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', {
        name: 'Organiza las actividades de tu comunidad',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Comenzar registro' }),
    ).toHaveAttribute('href', appRoutes.createCommunity)
    expect(
      screen.getByRole('link', { name: 'Ver mis solicitudes' }),
    ).toHaveAttribute('href', appRoutes.communityRequests)
    expect(
      screen.getByRole('button', { name: /Disponible próximamente/ }),
    ).toBeDisabled()
  })

  it('sends an existing organizer to the managed communities dashboard', () => {
    mockedUseAuth.mockReturnValue({
      ...defaultAuthValue,
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
        <OrganizePage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: 'Ver mis comunidades' }),
    ).toHaveAttribute('href', appRoutes.myCommunities)
  })
})
