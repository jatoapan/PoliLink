import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'

import { appRoutePatterns, appRoutes } from '@/app/routes'
import { EventAttendeesPage } from '@/features/registrations/attendees/pages/EventAttendeesPage'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'

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

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[appRoutes.eventAttendees(7)]}>
        <Routes>
          <Route
            element={<EventAttendeesPage />}
            path={`/${appRoutePatterns.eventAttendees}`}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('event attendees page', () => {
  it('renders the attendee list and capacity summary', async () => {
    server.use(
      http.get(`${apiUrl}/events/7`, () =>
        HttpResponse.json({ data: event }),
      ),
      http.get(`${apiUrl}/events/7/registrations`, () =>
        HttpResponse.json({
          data: [
            {
              id: 5,
              registered_at: '2026-08-11T10:00:00.000000Z',
              cancelled_at: null,
              status: { code: 'active', name: 'Activa' },
              user: {
                id: 2,
                first_name: 'Estudiante',
                last_name: 'PoliLink',
                email: 'student@espol.edu.ec',
              },
            },
          ],
          summary: {
            capacity: 30,
            active_registrations: 1,
            available_capacity: 29,
          },
        }),
      ),
    )

    renderPage()

    expect(
      await screen.findByRole('heading', {
        name: 'Inscritos de Taller Laravel',
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('student@espol.edu.ec').length).toBeGreaterThan(
      0,
    )
    expect(screen.getByText('Cupos disponibles')).toBeInTheDocument()
  })

  it('shows the empty state when there are no attendees', async () => {
    server.use(
      http.get(`${apiUrl}/events/7`, () =>
        HttpResponse.json({ data: event }),
      ),
      http.get(`${apiUrl}/events/7/registrations`, () =>
        HttpResponse.json({
          data: [],
          summary: { capacity: 30, active_registrations: 0, available_capacity: 30 },
        }),
      ),
    )

    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Aún no hay inscritos' }),
    ).toBeInTheDocument()
  })

  it('explains a 403 without hiding it as an empty list', async () => {
    server.use(
      http.get(`${apiUrl}/events/7`, () =>
        HttpResponse.json({ data: event }),
      ),
      http.get(`${apiUrl}/events/7/registrations`, () =>
        HttpResponse.json(
          { message: 'El organizador no administra la comunidad del evento.' },
          { status: 403 },
        ),
      ),
    )

    renderPage()

    expect(
      await screen.findByText(
        'Solo el organizador responsable de este evento puede consultar la lista de inscritos.',
      ),
    ).toBeInTheDocument()
  })
})
