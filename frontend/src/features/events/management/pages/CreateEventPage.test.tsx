import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { addDays, format, startOfToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { HttpResponse, http } from 'msw'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { appRoutes } from '@/app/routes'
import { CreateEventPage } from '@/features/events/management/pages/CreateEventPage'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'

function setCsrfCookie() {
  // biome-ignore lint/suspicious/noDocumentCookie: The request client reads this cookie during the integration test.
  document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
}

const community = {
  id: 4,
  name: 'TAWS',
  slug: 'taws',
  description: 'Club de tecnología.',
  image_url: null,
}

const category = { id: 3, code: 'hackathon', name: 'Hackathon' }
const modality = { id: 1, code: 'in_person', name: 'Presencial' }
const location = { id: 1, name: 'Campus ESPOL', description: null }
const event = {
  id: 7,
  title: 'Taller Laravel',
  description: 'Introducción práctica a Laravel.',
  image_url: null,
  starts_at: '2099-08-20T15:30:00.000000Z',
  capacity: 30,
  available_capacity: 30,
  category,
  modality,
  location,
  community: {
    id: community.id,
    name: community.name,
    slug: community.slug,
    description: community.description,
  },
  status: { code: 'published', name: 'Publicado' },
  created_at: '2099-08-01T15:00:00.000000Z',
  updated_at: '2099-08-01T15:00:00.000000Z',
}

function LocationProbe() {
  const currentLocation = useLocation()

  return <output data-testid="location">{currentLocation.pathname}</output>
}

function referenceHandlers() {
  return [
    http.get(`${apiUrl}/me/communities`, () =>
      HttpResponse.json({ data: [community] }),
    ),
    http.get(`${apiUrl}/event-categories`, () =>
      HttpResponse.json({ data: [category] }),
    ),
    http.get(`${apiUrl}/event-modalities`, () =>
      HttpResponse.json({ data: [modality] }),
    ),
    http.get(`${apiUrl}/locations`, () =>
      HttpResponse.json({ data: [location] }),
    ),
  ]
}

function renderCreateEvent() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })
  const router = createMemoryRouter(
    [
      { element: <CreateEventPage />, path: appRoutes.createEvent },
      { element: <LocationProbe />, path: appRoutes.myEvents },
      { element: <div>crear comunidad</div>, path: appRoutes.createCommunity },
    ],
    { initialEntries: [appRoutes.createEvent] },
  )

  return {
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  }
}

async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) {
  await user.click(screen.getByRole('combobox', { name: label }))
  await user.click(await screen.findByRole('option', { name: option }))
  await waitFor(() =>
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
  )
}

async function fillBasicDetails(user: ReturnType<typeof userEvent.setup>) {
  const titleInput = await screen.findByRole('textbox', {
    name: 'Título del evento',
  })
  await user.type(titleInput, 'Taller Laravel')
  await user.type(
    screen.getByRole('textbox', { name: 'Descripción del evento' }),
    'Introducción práctica a Laravel.',
  )
  await selectOption(user, 'Categoría', 'Hackathon')
  await selectOption(user, 'Comunidad organizadora', 'TAWS')
}

async function fillEventDetails(user: ReturnType<typeof userEvent.setup>) {
  const today = startOfToday()
  const eventDate = addDays(today, 7)

  await user.click(screen.getByRole('button', { name: 'Fecha' }))

  if (eventDate.getMonth() !== today.getMonth()) {
    await user.click(
      screen.getByRole('button', { name: 'Ir al mes siguiente' }),
    )
  }

  await user.click(
    screen.getByRole('button', {
      name: format(eventDate, 'PPPP', { locale: es }),
    }),
  )

  await user.click(screen.getByRole('button', { name: 'Hora (ESPOL)' }))
  await user.click(screen.getByRole('combobox', { name: 'Hora' }))
  await user.click(screen.getByRole('option', { name: '10' }))
  await user.click(screen.getByRole('combobox', { name: 'Minutos' }))
  await user.click(screen.getByRole('option', { name: '30' }))

  await selectOption(user, 'Modalidad', 'Presencial')
  await selectOption(user, 'Ubicación', 'Campus ESPOL')
  await user.type(
    screen.getByRole('spinbutton', { name: 'Cupos disponibles' }),
    '30',
  )
}

describe('create event page', () => {
  beforeEach(() => {
    server.use(...referenceHandlers())
  })

  it('keeps basic details and an image while moving between steps', async () => {
    const user = userEvent.setup()
    renderCreateEvent()

    await fillBasicDetails(user)
    await user.click(
      screen.getByRole('button', { name: 'Continuar con los detalles' }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Detalles y publicación' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Taller Laravel')).toBeInTheDocument()

    const image = new File(['cover'], 'cover.webp', { type: 'image/webp' })
    await user.upload(screen.getByLabelText('Imagen del evento'), image)
    expect(
      screen.getByAltText('Vista previa de cover.webp'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Atrás' }))
    expect(
      screen.getByRole('textbox', { name: 'Título del evento' }),
    ).toHaveValue('Taller Laravel')

    await user.click(
      screen.getByRole('button', { name: 'Continuar con los detalles' }),
    )
    expect(
      screen.getByAltText('Vista previa de cover.webp'),
    ).toBeInTheDocument()
  }, 15_000)

  it('publishes the event with JSON and redirects to the organizer events', async () => {
    setCsrfCookie()
    let receivedPayload: unknown
    let receivedBody: unknown

    server.use(
      http.post(`${apiUrl}/events`, async ({ request }) => {
        expect(request.headers.get('Content-Type')).toContain(
          'application/json',
        )
        receivedBody = await request.json()
        receivedPayload = 'received'

        return HttpResponse.json({ data: event }, { status: 201 })
      }),
    )

    const user = userEvent.setup()
    renderCreateEvent()
    await fillBasicDetails(user)
    await user.click(
      screen.getByRole('button', { name: 'Continuar con los detalles' }),
    )
    await fillEventDetails(user)
    await user.click(screen.getByRole('button', { name: 'Publicar evento' }))

    await waitFor(() => expect(receivedPayload).not.toBeUndefined())
    expect(await screen.findByTestId('location')).toHaveTextContent(
      appRoutes.myEvents,
    )
    expect(receivedPayload).toBe('received')
    expect(receivedBody).toMatchObject({
      starts_at: expect.stringMatching(/T\d{2}:30:00-05:00$/),
    })
  }, 15_000)

  it('locks the form while publishing and releases it after success', async () => {
    setCsrfCookie()
    let releaseRequest: (() => void) | undefined
    const requestReleased = new Promise<void>((resolve) => {
      releaseRequest = resolve
    })

    server.use(
      http.post(`${apiUrl}/events`, async () => {
        await requestReleased
        return HttpResponse.json({ data: event }, { status: 201 })
      }),
    )

    const user = userEvent.setup()
    renderCreateEvent()
    await fillBasicDetails(user)
    await user.click(
      screen.getByRole('button', { name: 'Continuar con los detalles' }),
    )
    await fillEventDetails(user)
    await user.click(screen.getByRole('button', { name: 'Publicar evento' }))

    expect(
      await screen.findByRole('button', { name: 'Publicando evento…' }),
    ).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )

    releaseRequest?.()
    expect(await screen.findByTestId('location')).toHaveTextContent(
      appRoutes.myEvents,
    )
  }, 15_000)

  it('blocks leaving a dirty form and preserves the entered value', async () => {
    const user = userEvent.setup()
    renderCreateEvent()

    await user.type(
      await screen.findByRole('textbox', { name: 'Título del evento' }),
      'Evento pendiente',
    )
    await user.click(screen.getByRole('link', { name: 'Volver a mis eventos' }))

    expect(
      await screen.findByRole('heading', { name: '¿Salir sin publicar?' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continuar editando' }))
    expect(
      screen.getByRole('textbox', { name: 'Título del evento' }),
    ).toHaveValue('Evento pendiente')

    await user.click(screen.getByRole('link', { name: 'Volver a mis eventos' }))
    await user.click(screen.getByRole('button', { name: 'Salir sin guardar' }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        appRoutes.myEvents,
      )
    })
  })

  it('explains that a community is needed before publishing', async () => {
    server.use(
      http.get(`${apiUrl}/me/communities`, () =>
        HttpResponse.json({ data: [] }),
      ),
    )

    renderCreateEvent()

    expect(
      await screen.findByRole('heading', {
        name: 'Primero necesitas una comunidad',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Registrar una comunidad' }),
    ).toHaveAttribute('href', appRoutes.createCommunity)
  })
})
