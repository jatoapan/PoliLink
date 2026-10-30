import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'

import { appRoutePatterns, appRoutes } from '@/app/routes'
import { AuthProvider } from '@/features/auth/auth-context'
import { EventDetailPage } from '@/features/events/detail/pages/EventDetailPage'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'

function setCsrfCookie() {
  // biome-ignore lint/suspicious/noDocumentCookie: The request client reads this cookie during the integration test.
  document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
}

const publishedEvent = {
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

const authenticatedUser = {
  id: 2,
  first_name: 'Estudiante',
  last_name: 'PoliLink',
  email: 'student@espol.edu.ec',
  is_admin: false,
  community_memberships: [],
}

function renderEventDetail(eventId: number) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[appRoutes.eventDetail(eventId)]}>
          <Routes>
            <Route
              element={<EventDetailPage />}
              path={`/${appRoutePatterns.eventDetail}`}
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('public event detail', () => {
  it('renders the published event details and visible capacity', async () => {
    server.use(
      http.get(`${apiUrl}/events/7`, () =>
        HttpResponse.json({ data: publishedEvent }),
      ),
    )

    renderEventDetail(7)

    expect(
      await screen.findByRole('heading', { name: 'Taller Laravel' }),
    ).toBeInTheDocument()
    expect(screen.getByAltText('Portada de Taller Laravel')).toHaveAttribute(
      'src',
      'http://localhost:8000/storage/events/laravel.webp',
    )
    expect(screen.getByText('29 de 30 cupos disponibles')).toBeInTheDocument()
    expect(screen.getByText('Campus')).toBeInTheDocument()
  })

  it('prompts anonymous users to sign in before registering', async () => {
    server.use(
      http.get(`${apiUrl}/events/7`, () =>
        HttpResponse.json({ data: publishedEvent }),
      ),
    )

    renderEventDetail(7)

    expect(
      await screen.findByRole('link', { name: 'Inicia sesión para inscribirte' }),
    ).toHaveAttribute('href', expect.stringContaining(appRoutes.login))
  })

  it('prompts anonymous users to sign in before joining the organizing community', async () => {
    server.use(
      http.get(`${apiUrl}/events/7`, () =>
        HttpResponse.json({ data: publishedEvent }),
      ),
    )

    renderEventDetail(7)

    expect(
      await screen.findByRole('link', {
        name: 'Inicia sesión para unirte a TAWS',
      }),
    ).toHaveAttribute('href', expect.stringContaining(appRoutes.login))
  })

  it('lets an authenticated user request community membership and then cancel it', async () => {
    let membership: {
      community: { id: number; name: string; slug: string }
      role: { code: string; name: string }
      status: { code: string; name: string }
      requested_at: string | null
      reviewed_at: string | null
    } | null = null

    server.use(
      http.get(`${apiUrl}/events/7`, () =>
        HttpResponse.json({ data: publishedEvent }),
      ),
      http.get(`${apiUrl}/auth/me`, () =>
        HttpResponse.json({
          data: {
            ...authenticatedUser,
            community_memberships: membership ? [membership] : [],
          },
        }),
      ),
      http.get(`${apiUrl}/me/registrations`, () =>
        HttpResponse.json({
          data: [],
          meta: { current_page: 1, last_page: 1, per_page: 50, total: 0 },
        }),
      ),
      http.post(`${apiUrl}/communities/4/membership-requests`, () => {
        membership = {
          community: { id: 4, name: 'TAWS', slug: 'taws' },
          role: { code: 'member', name: 'Miembro' },
          status: { code: 'pending', name: 'Pendiente' },
          requested_at: '2026-08-10T10:00:00.000000Z',
          reviewed_at: null,
        }

        return HttpResponse.json(
          {
            data: {
              id: 55,
              community: { id: 4, name: 'TAWS', slug: 'taws', description: null, image_url: null },
              role: { code: 'member', name: 'Miembro' },
              status: { code: 'pending', name: 'Pendiente' },
              requested_at: '2026-08-10T10:00:00.000000Z',
              reviewed_at: null,
            },
          },
          { status: 201 },
        )
      }),
      http.delete(`${apiUrl}/communities/4/membership-requests`, () => {
        membership = null

        return HttpResponse.json({
          data: {
            id: 55,
            community: { id: 4, name: 'TAWS', slug: 'taws', description: null, image_url: null },
            role: { code: 'member', name: 'Miembro' },
            status: { code: 'left', name: 'Retirada' },
            requested_at: '2026-08-10T10:00:00.000000Z',
            reviewed_at: null,
          },
        })
      }),
    )

    setCsrfCookie()
    const user = userEvent.setup()
    renderEventDetail(7)

    const joinButton = await screen.findByRole('button', {
      name: 'Unirme a TAWS',
    })
    await user.click(joinButton)

    expect(await screen.findByText('Solicitud enviada')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Cancelar solicitud' }),
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Unirme a TAWS' }),
      ).toBeInTheDocument()
    })
  })

  it('lets an authenticated user register and then cancel', async () => {
    let isRegistered = false

    server.use(
      http.get(`${apiUrl}/events/7`, () =>
        HttpResponse.json({
          data: { ...publishedEvent, available_capacity: isRegistered ? 28 : 29 },
        }),
      ),
      http.get(`${apiUrl}/auth/me`, () =>
        HttpResponse.json({ data: authenticatedUser }),
      ),
      http.get(`${apiUrl}/me/registrations`, () =>
        HttpResponse.json({
          data: isRegistered
            ? [
                {
                  id: 99,
                  registered_at: '2026-08-10T10:00:00.000000Z',
                  cancelled_at: null,
                  status: { code: 'active', name: 'Activa' },
                  event: { ...publishedEvent, available_capacity: 28 },
                },
              ]
            : [],
          meta: { current_page: 1, last_page: 1, per_page: 50, total: 0 },
        }),
      ),
      http.post(`${apiUrl}/events/7/registrations`, () => {
        isRegistered = true

        return HttpResponse.json(
          {
            data: {
              id: 99,
              registered_at: '2026-08-10T10:00:00.000000Z',
              cancelled_at: null,
              status: { code: 'active', name: 'Activa' },
              event: { ...publishedEvent, available_capacity: 28 },
            },
          },
          { status: 201 },
        )
      }),
      http.delete(`${apiUrl}/events/7/registrations`, () => {
        isRegistered = false

        return HttpResponse.json({
          data: {
            id: 99,
            registered_at: '2026-08-10T10:00:00.000000Z',
            cancelled_at: '2026-08-11T10:00:00.000000Z',
            status: { code: 'cancelled', name: 'Cancelada' },
            event: publishedEvent,
          },
        })
      }),
    )

    setCsrfCookie()
    const user = userEvent.setup()
    renderEventDetail(7)

    const registerButton = await screen.findByRole('button', {
      name: 'Inscribirme',
    })
    await user.click(registerButton)

    expect(
      await screen.findByRole('button', { name: 'Cancelar mi inscripción' }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Cancelar mi inscripción' }),
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Inscribirme' }),
      ).toBeInTheDocument()
    })
  })
})
