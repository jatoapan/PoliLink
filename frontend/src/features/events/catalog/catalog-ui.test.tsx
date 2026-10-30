import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { appRoutes } from '@/app/routes'
import { type AuthContextValue, useAuth } from '@/features/auth/auth-context'
import { EventCatalogPage } from '@/features/events/catalog/pages/EventCatalogPage'
import { server } from '@/test/server'

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)
const apiUrl = 'http://localhost:8000/api'

const anonymousAuth: AuthContextValue = {
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

const organizerUser = {
  id: 7,
  first_name: 'Ana',
  last_name: 'Torres',
  email: 'ana@espol.edu.ec' as `${string}@${string}.${string}`,
  is_admin: false,
  community_memberships: [
    {
      community: { id: 4, name: 'TAWS', slug: 'taws' },
      role: { code: 'organizer' as const, name: 'Organizer' },
      status: { code: 'active' as const, name: 'Active' },
      requested_at: null,
      reviewed_at: null,
    },
  ],
}

const event = {
  id: 7,
  title: 'Taller Laravel',
  description: 'Introducción a Laravel.',
  image_url: 'http://localhost:8000/storage/events/laravel.webp',
  starts_at: '2026-08-20T15:00:00.000000Z',
  capacity: 30,
  available_capacity: 29,
  category: { id: 3, code: 'hackathon', name: 'Hackathon' },
  modality: { id: 1, code: 'in_person', name: 'Presencial' },
  location: { id: 1, name: 'Campus', description: null },
  community: {
    id: 4,
    name: 'TAWS',
    slug: 'taws',
    description: null,
  },
  status: { code: 'published', name: 'Publicado' },
  created_at: '2026-08-01T15:00:00.000000Z',
  updated_at: '2026-08-01T15:00:00.000000Z',
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

function renderCatalog(initialEntry = appRoutes.events) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            element={
              <>
                <EventCatalogPage />
                <LocationProbe />
              </>
            }
            path={appRoutes.events}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function referenceHandlers() {
  return [
    http.get(`${apiUrl}/event-categories`, () =>
      HttpResponse.json({ data: [event.category] }),
    ),
    http.get(`${apiUrl}/event-modalities`, () =>
      HttpResponse.json({ data: [event.modality] }),
    ),
    http.get(`${apiUrl}/communities`, () =>
      HttpResponse.json({ data: [event.community] }),
    ),
  ]
}

describe('public event catalog', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue(anonymousAuth)
    server.use(...referenceHandlers())
  })

  it('renders events and debounces search into the URL', async () => {
    const requestedSearches: string[] = []

    server.use(
      http.get(`${apiUrl}/events`, ({ request }) => {
        requestedSearches.push(
          new URL(request.url).searchParams.get('search') ?? '',
        )

        return HttpResponse.json({
          data: [event],
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 12,
            total: 1,
          },
        })
      }),
    )

    const user = userEvent.setup()
    renderCatalog()

    expect(
      await screen.findByRole('link', {
        name: 'Ver detalles de Taller Laravel',
      }),
    ).toBeInTheDocument()
    expect(screen.getByAltText('Portada de Taller Laravel')).toHaveAttribute(
      'src',
      event.image_url,
    )
    expect(
      screen.getByRole('link', { name: 'Conoce cómo organizar' }),
    ).toHaveAttribute('href', appRoutes.organize)

    await user.type(screen.getByRole('searchbox'), 'laravel')

    await waitFor(() => {
      expect(requestedSearches).toContain('laravel')
      expect(screen.getByTestId('location')).toHaveTextContent(
        `${appRoutes.events}?search=laravel`,
      )
    })
  })

  it('shows management actions instead of onboarding for organizers', async () => {
    mockedUseAuth.mockReturnValue({
      ...anonymousAuth,
      status: 'authenticated',
      user: organizerUser,
    })

    server.use(
      http.get(`${apiUrl}/events`, () =>
        HttpResponse.json({
          data: [event],
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 12,
            total: 1,
          },
        }),
      ),
    )

    renderCatalog()

    expect(
      screen.queryByRole('heading', { name: 'Gestiona tus actividades' }),
    ).not.toBeInTheDocument()
    expect(
      await screen.findByRole('group', { name: 'Acciones de organización' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Crear evento' })).toHaveAttribute(
      'href',
      appRoutes.createEvent,
    )
    expect(
      screen.getByRole('link', { name: 'Ver mis eventos' }),
    ).toHaveAttribute('href', appRoutes.myEvents)
    expect(
      screen.queryByRole('link', { name: 'Conoce cómo organizar' }),
    ).not.toBeInTheDocument()
  })
})
