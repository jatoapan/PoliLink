import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'

import { appRoutes } from '@/app/routes'
import { MyRegistrationsPage } from '@/features/registrations/student/pages/MyRegistrationsPage'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'

function setCsrfCookie() {
  // biome-ignore lint/suspicious/noDocumentCookie: The request client reads this cookie during the integration test.
  document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
}

const event = {
  id: 7,
  title: 'Taller Laravel',
  description: 'Introducción a Laravel.',
  image_url: null,
  starts_at: '2026-08-20T15:00:00.000000Z',
  capacity: 30,
  available_capacity: 29,
  category: { id: 3, code: 'hackathon', name: 'Hackathon' },
  modality: { id: 1, code: 'in_person', name: 'Presencial' },
  location: { id: 1, name: 'Campus', description: null },
  community: { id: 4, name: 'TAWS', slug: 'taws', description: null },
  status: { code: 'published', name: 'Publicado' },
  created_at: '2026-08-01T15:00:00.000000Z',
  updated_at: '2026-08-01T15:00:00.000000Z',
}

const registration = {
  id: 5,
  registered_at: '2026-08-11T10:00:00.000000Z',
  cancelled_at: null,
  status: { code: 'active', name: 'Activa' },
  event,
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[appRoutes.myRegistrations]}>
        <Routes>
          <Route
            element={<MyRegistrationsPage />}
            path={appRoutes.myRegistrations}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('my registrations page', () => {
  it('renders active registrations', async () => {
    server.use(
      http.get(`${apiUrl}/me/registrations`, () =>
        HttpResponse.json({
          data: [registration],
          meta: { current_page: 1, last_page: 1, per_page: 12, total: 1 },
        }),
      ),
    )

    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Mis inscripciones' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('link', {
        name: 'Ver detalles de Taller Laravel',
      }),
    ).toHaveAttribute('href', appRoutes.eventDetail(event.id))
    expect(screen.getByText('29 de 30 cupos disponibles')).toBeInTheDocument()
  })

  it('shows an empty state with a link to explore events', async () => {
    server.use(
      http.get(`${apiUrl}/me/registrations`, () =>
        HttpResponse.json({
          data: [],
          meta: { current_page: 1, last_page: 1, per_page: 12, total: 0 },
        }),
      ),
    )

    renderPage()

    expect(
      await screen.findByRole('heading', {
        name: 'Todavía no tienes inscripciones',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Explorar eventos' }),
    ).toHaveAttribute('href', appRoutes.events)
  })

  it('cancels a registration after confirming', async () => {
    let cancelled = false

    server.use(
      http.get(`${apiUrl}/me/registrations`, () =>
        HttpResponse.json({
          data: cancelled ? [] : [registration],
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 12,
            total: cancelled ? 0 : 1,
          },
        }),
      ),
      http.delete(`${apiUrl}/events/7/registrations`, () => {
        cancelled = true

        return HttpResponse.json({
          data: { ...registration, status: { code: 'cancelled', name: 'Cancelada' } },
        })
      }),
    )

    setCsrfCookie()
    const user = userEvent.setup()
    renderPage()

    await user.click(
      await screen.findByRole('button', {
        name: 'Cancelar inscripción a Taller Laravel',
      }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Cancelar inscripción' }),
    )

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: 'Todavía no tienes inscripciones',
        }),
      ).toBeInTheDocument()
    })
  })
})
