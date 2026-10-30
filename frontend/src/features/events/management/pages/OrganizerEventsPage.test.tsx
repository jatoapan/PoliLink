import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import {
  type InitialEntry,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { appRoutes } from '@/app/routes'
import { OrganizerEventsPage } from '@/features/events/management/pages/OrganizerEventsPage'
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

const cancelledEvent = {
  ...publishedEvent,
  id: 8,
  title: 'Encuentro cancelado',
  image_url: null,
  status: { code: 'cancelled', name: 'Cancelado' },
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

function renderPage(initialEntry: InitialEntry = appRoutes.myEvents) {
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
                <OrganizerEventsPage />
                <LocationProbe />
              </>
            }
            path={appRoutes.myEvents}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('organizer events page', () => {
  beforeEach(() => {
    server.use(
      http.get(`${apiUrl}/me/events`, () =>
        HttpResponse.json({
          data: [publishedEvent, cancelledEvent],
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 12,
            total: 2,
          },
        }),
      ),
    )
  })

  it('renders published and cancelled events with the correct public link behavior', async () => {
    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Mis eventos' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Publicado')).toBeInTheDocument()
    expect(await screen.findByText('Cancelado')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ver detalles de Taller Laravel' }),
    ).toHaveAttribute('href', appRoutes.eventDetail(publishedEvent.id))
    expect(
      screen.getByRole('link', { name: 'Editar evento Taller Laravel' }),
    ).toHaveAttribute('href', appRoutes.editEvent(publishedEvent.id))
    expect(
      screen.queryByRole('link', {
        name: 'Ver detalles de Encuentro cancelado',
      }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Editar evento Encuentro cancelado' }),
    ).not.toBeInTheDocument()
    expect(screen.getByAltText('Portada de Taller Laravel')).toBeInTheDocument()
  })

  it('requires confirmation and refreshes the history after cancelling an event', async () => {
    setCsrfCookie()
    let currentEvent = publishedEvent
    let requestBody: string | undefined

    server.use(
      http.get(`${apiUrl}/me/events`, () =>
        HttpResponse.json({
          data: [currentEvent],
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 12,
            total: 1,
          },
        }),
      ),
      http.patch(
        `${apiUrl}/events/${publishedEvent.id}/cancel`,
        async ({ request }) => {
          requestBody = await request.text()
          currentEvent = {
            ...publishedEvent,
            status: { code: 'cancelled', name: 'Cancelado' },
          }

          return HttpResponse.json({ data: currentEvent })
        },
      ),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Taller Laravel')
    await user.click(
      screen.getByRole('button', {
        name: 'Cancelar evento Taller Laravel',
      }),
    )

    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(
        '“Taller Laravel” dejará de aparecer en el catálogo público y ya no podrás editarlo. El evento se conservará en tu historial como cancelado.',
      ),
    ).toBeInTheDocument()
    expect(requestBody).toBeUndefined()

    await user.click(
      within(dialog).getByRole('button', { name: 'Cancelar evento' }),
    )

    await waitFor(() => {
      expect(requestBody).toBe('')
      expect(screen.getByText('Cancelado')).toBeInTheDocument()
    })
    expect(
      screen.queryByRole('button', {
        name: 'Cancelar evento Taller Laravel',
      }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Editar evento Taller Laravel' }),
    ).not.toBeInTheDocument()
  })

  it('prevents a second cancellation while the first request is pending', async () => {
    setCsrfCookie()
    let requestCount = 0
    let resolveRequest: ((response: Response) => void) | undefined

    server.use(
      http.patch(`${apiUrl}/events/${publishedEvent.id}/cancel`, () => {
        requestCount += 1

        return new Promise((resolve) => {
          resolveRequest = resolve
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Taller Laravel')
    await user.click(
      screen.getByRole('button', {
        name: 'Cancelar evento Taller Laravel',
      }),
    )

    const dialog = await screen.findByRole('dialog')
    const confirmButton = within(dialog).getByRole('button', {
      name: 'Cancelar evento',
    })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(requestCount).toBe(1)
      expect(confirmButton).toBeDisabled()
      expect(within(dialog).getByText('Cancelando…')).toBeInTheDocument()
    })
    await user.click(confirmButton)
    expect(requestCount).toBe(1)

    resolveRequest?.(
      HttpResponse.json({
        data: {
          ...publishedEvent,
          status: { code: 'cancelled', name: 'Cancelado' },
        },
      }),
    )

    await waitFor(() =>
      expect(screen.getByText('Cancelado')).toBeInTheDocument(),
    )
  })

  it.each([
    {
      expected: 'No tienes permisos para cancelar este evento.',
      status: 403,
    },
    {
      expected:
        'Este evento ya fue cancelado. Actualiza el historial para ver su estado.',
      status: 409,
    },
    { expected: 'Revisa los datos ingresados.', status: 422 },
  ])(
    'shows the centralized cancellation error for status $status',
    async ({ expected, status }) => {
      setCsrfCookie()
      server.use(
        http.patch(`${apiUrl}/events/${publishedEvent.id}/cancel`, () =>
          HttpResponse.json({ message: 'Cancellation failed.' }, { status }),
        ),
      )

      const user = userEvent.setup()
      renderPage()
      await screen.findByText('Taller Laravel')
      await user.click(
        screen.getByRole('button', {
          name: 'Cancelar evento Taller Laravel',
        }),
      )
      const dialog = await screen.findByRole('dialog')
      await user.click(
        within(dialog).getByRole('button', { name: 'Cancelar evento' }),
      )

      expect(await screen.findByText(expected)).toBeInTheDocument()
      expect(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Reintentar',
        }),
      ).toBeInTheDocument()
    },
  )

  it('shows the network error and keeps cancellation available to retry', async () => {
    setCsrfCookie()
    server.use(
      http.patch(`${apiUrl}/events/${publishedEvent.id}/cancel`, () =>
        HttpResponse.error(),
      ),
    )

    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Taller Laravel')
    await user.click(
      screen.getByRole('button', {
        name: 'Cancelar evento Taller Laravel',
      }),
    )
    const dialog = await screen.findByRole('dialog')
    await user.click(
      within(dialog).getByRole('button', { name: 'Cancelar evento' }),
    )

    expect(
      await screen.findByText(
        'No pudimos conectarnos con PoliLink. Intenta nuevamente.',
      ),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Reintentar',
      }),
    ).toBeInTheDocument()
  })

  it('requests and persists the selected page', async () => {
    const requestedPages: string[] = []

    server.use(
      http.get(`${apiUrl}/me/events`, ({ request }) => {
        const query = new URL(request.url).searchParams
        requestedPages.push(query.get('page') ?? '')

        return HttpResponse.json({
          data: [publishedEvent],
          meta: {
            current_page: Number(query.get('page') ?? '1'),
            last_page: 2,
            per_page: 12,
            total: 13,
          },
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Taller Laravel')
    await user.click(screen.getByRole('button', { name: 'Página 2' }))

    await waitFor(() => {
      expect(requestedPages).toContain('2')
      expect(screen.getByTestId('location')).toHaveTextContent(
        `${appRoutes.myEvents}?page=2`,
      )
    })
  })

  it('shows an empty state when the organizer has no events', async () => {
    server.use(
      http.get(`${apiUrl}/me/events`, () =>
        HttpResponse.json({
          data: [],
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 12,
            total: 0,
          },
        }),
      ),
    )

    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Aún no tienes eventos' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ver mis comunidades' }),
    ).toHaveAttribute('href', appRoutes.myCommunities)
  })

  it('shows the publication confirmation after creating an event', async () => {
    renderPage({
      pathname: appRoutes.myEvents,
      state: { createdEventTitle: 'Taller Laravel' },
    })

    expect(
      await screen.findByText('Evento publicado correctamente'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        '“Taller Laravel” ya está disponible para los estudiantes.',
      ),
    ).toBeInTheDocument()
  })

  it('shows the update confirmation after editing an event', async () => {
    renderPage({
      pathname: appRoutes.myEvents,
      state: {
        eventNotice: { action: 'updated', title: 'Taller Laravel' },
      },
    })

    expect(
      await screen.findByText('Evento actualizado correctamente'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        '“Taller Laravel” conserva su publicación con la información actualizada.',
      ),
    ).toBeInTheDocument()
  })

  it('shows a retry action when the event request fails', async () => {
    server.use(
      http.get(`${apiUrl}/me/events`, () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 }),
      ),
    )

    renderPage()

    expect(
      await screen.findByText('No se pudieron cargar tus eventos'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument()
  })
})
