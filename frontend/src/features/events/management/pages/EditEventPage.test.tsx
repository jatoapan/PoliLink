import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'

import { appRoutePatterns, appRoutes } from '@/app/routes'
import { EditEventPage } from '@/features/events/management/pages/EditEventPage'
import type { Event } from '@/features/events/model/event.schemas'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'

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

const event: Event = {
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

const eventWithImage = {
  ...event,
  image_url: 'http://localhost:8000/storage/events/original.webp',
}

const cancelledEvent = {
  ...event,
  id: 8,
  title: 'Encuentro cancelado',
  status: { code: 'cancelled', name: 'Cancelado' },
}

function setCsrfCookie() {
  // biome-ignore lint/suspicious/noDocumentCookie: The request client reads this cookie during the integration test.
  document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
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

function LocationProbe() {
  const location = useLocation()

  return <output data-testid="location">{location.pathname}</output>
}

function renderEditEvent(eventResponse: Event = event) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  server.use(
    ...referenceHandlers(),
    http.get(`${apiUrl}/events/${eventResponse.id}`, () =>
      HttpResponse.json({ data: eventResponse }),
    ),
  )

  const router = createMemoryRouter(
    [
      { element: <EditEventPage />, path: appRoutePatterns.eventEdit },
      { element: <LocationProbe />, path: appRoutes.myEvents },
    ],
    { initialEntries: [appRoutes.editEvent(eventResponse.id)] },
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

async function submitEditedEvent(
  user: ReturnType<typeof userEvent.setup>,
  title = 'Taller Laravel actualizado',
) {
  const titleInput = await screen.findByRole(
    'textbox',
    { name: 'Título del evento' },
    { timeout: 5000 },
  )
  await user.clear(titleInput)
  await user.type(titleInput, title)
  await user.click(
    screen.getByRole('button', { name: 'Continuar con los detalles' }),
  )
  await screen.findByRole('heading', { name: 'Detalles y guardado' })
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
}

describe('edit event page', () => {
  it('preloads the event and presents its time in the ESPOL timezone', async () => {
    const user = userEvent.setup()
    renderEditEvent()

    expect(
      await screen.findByRole('heading', { name: 'Edita tu evento' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole(
        'textbox',
        { name: 'Título del evento' },
        { timeout: 5000 },
      ),
    ).toHaveValue('Taller Laravel')
    await user.click(
      screen.getByRole('button', { name: 'Continuar con los detalles' }),
    )
    await screen.findByRole('heading', { name: 'Detalles y guardado' })
    expect(screen.getByRole('button', { name: 'Fecha' })).toHaveTextContent(
      '20 de agosto de 2099',
    )
    expect(
      screen.getByRole('button', { name: 'Hora (ESPOL)' }),
    ).toHaveTextContent('10:30')
    expect(
      screen.getByRole('button', { name: 'Subir imagen del evento' }),
    ).toBeInTheDocument()
  })

  it('replaces the image immediately without changing the event fields', async () => {
    setCsrfCookie()
    let uploadedFile: unknown = null
    let currentEvent: Event = eventWithImage
    const replacementUrl =
      'http://localhost:8000/storage/events/replacement.webp'

    server.use(
      http.post(`${apiUrl}/events/${event.id}/image`, async ({ request }) => {
        const formData = await request.formData()
        const image = formData.get('image')

        uploadedFile = image
        currentEvent = { ...eventWithImage, image_url: replacementUrl }

        return HttpResponse.json({
          data: currentEvent,
        })
      }),
    )

    const user = userEvent.setup()
    renderEditEvent(eventWithImage)
    server.use(
      http.get(`${apiUrl}/events/${event.id}`, () =>
        HttpResponse.json({ data: currentEvent }),
      ),
    )
    await user.click(
      await screen.findByRole('button', { name: 'Continuar con los detalles' }),
    )

    const input = screen.getByLabelText('Imagen del evento')
    await user.upload(
      input,
      new File(['replacement'], 'replacement.webp', { type: 'image/webp' }),
    )

    await waitFor(() => {
      expect(uploadedFile).toMatchObject({ type: 'image/webp' })
    })
    expect(
      await screen.findByAltText('Portada actual del evento'),
    ).toHaveAttribute('src', replacementUrl)
  })

  it('removes the current image after explicit confirmation', async () => {
    setCsrfCookie()
    let deleteCalls = 0
    let currentEvent: Event = eventWithImage

    server.use(
      http.delete(`${apiUrl}/events/${event.id}/image`, () => {
        deleteCalls += 1

        const responseEvent = { ...eventWithImage, image_url: null }
        currentEvent = responseEvent

        return HttpResponse.json({ data: responseEvent })
      }),
    )

    const user = userEvent.setup()
    renderEditEvent(eventWithImage)
    server.use(
      http.get(`${apiUrl}/events/${event.id}`, () =>
        HttpResponse.json({ data: currentEvent }),
      ),
    )
    await user.click(
      await screen.findByRole('button', { name: 'Continuar con los detalles' }),
    )
    await user.click(screen.getByRole('button', { name: 'Eliminar imagen' }))

    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(
        'La imagen dejará de mostrarse en este evento. Puedes subir otra después desde este mismo formulario.',
      ),
    ).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Eliminar imagen' }),
    )

    await waitFor(() => {
      expect(deleteCalls).toBe(1)
      expect(
        screen.getByRole('button', { name: 'Subir imagen del evento' }),
      ).toBeInTheDocument()
    })
  })

  it('rejects unsupported image files before sending them to the API', async () => {
    setCsrfCookie()
    let uploadCalls = 0

    server.use(
      http.post(`${apiUrl}/events/${event.id}/image`, () => {
        uploadCalls += 1
        return HttpResponse.json({ data: eventWithImage })
      }),
    )

    const user = userEvent.setup({ applyAccept: false })
    renderEditEvent(event)
    await user.click(
      await screen.findByRole('button', { name: 'Continuar con los detalles' }),
    )
    await user.upload(
      screen.getByLabelText('Imagen del evento'),
      new File(['invalid'], 'animation.gif', { type: 'image/gif' }),
    )

    expect(
      await screen.findByText('La imagen debe ser JPG, PNG o WebP.'),
    ).toBeInTheDocument()
    expect(uploadCalls).toBe(0)
  })

  it('updates the event with JSON and redirects without sending an image', async () => {
    setCsrfCookie()
    let receivedBody: unknown

    server.use(
      http.patch(`${apiUrl}/events/${event.id}`, async ({ request }) => {
        expect(request.headers.get('Content-Type')).toContain(
          'application/json',
        )
        receivedBody = await request.json()

        return HttpResponse.json({
          data: { ...event, title: 'Taller Laravel actualizado' },
        })
      }),
    )

    const user = userEvent.setup()
    renderEditEvent()
    await submitEditedEvent(user)

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        appRoutes.myEvents,
      )
    })
    expect(receivedBody).toEqual({
      capacity: 30,
      community_id: 4,
      description: 'Introducción práctica a Laravel.',
      event_category_id: 3,
      event_modality_id: 1,
      location_id: 1,
      starts_at: '2099-08-20T10:30:00-05:00',
      title: 'Taller Laravel actualizado',
    })
  })

  it('shows a conflict message when the event was cancelled before saving', async () => {
    setCsrfCookie()
    server.use(
      http.patch(`${apiUrl}/events/${event.id}`, () =>
        HttpResponse.json(
          { message: 'The event is cancelled.' },
          { status: 409 },
        ),
      ),
    )

    const user = userEvent.setup()
    renderEditEvent()
    await submitEditedEvent(user)

    expect(
      await screen.findByText(
        'Este evento ya fue cancelado y no puede editarse.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    ).toBeEnabled()
  })

  it('blocks editing a cancelled event while preserving it as history', async () => {
    renderEditEvent(cancelledEvent)

    expect(
      await screen.findByRole('heading', {
        name: 'Este evento está cancelado',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Los eventos cancelados se conservan en tu historial, pero ya no pueden editarse.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Guardar cambios' }),
    ).not.toBeInTheDocument()
  })
})
