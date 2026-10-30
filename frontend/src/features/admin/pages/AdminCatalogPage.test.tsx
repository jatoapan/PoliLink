import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { AdminCatalogPage } from '@/features/admin/pages/AdminCatalogPage'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'

function setCsrfCookie() {
  document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
}

const category = { id: 1, code: 'hackathon', name: 'Hackathon', is_active: true }
const modality = { id: 2, code: 'in_person', name: 'Presencial', is_active: true }
const location = {
  id: 3,
  name: 'Campus Gustavo Galindo',
  description: 'Campus principal de ESPOL.',
  is_active: true,
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminCatalogPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('admin catalog page', () => {
  beforeEach(() => {
    server.use(
      http.get(`${apiUrl}/admin/catalog/event-categories`, () =>
        HttpResponse.json({ data: [category] }),
      ),
      http.get(`${apiUrl}/admin/catalog/event-modalities`, () =>
        HttpResponse.json({ data: [modality] }),
      ),
      http.get(`${apiUrl}/admin/catalog/locations`, () =>
        HttpResponse.json({ data: [location] }),
      ),
    )
  })

  it('lists categories, modalities and locations', async () => {
    renderPage()

    expect(await screen.findByDisplayValue('Hackathon')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Presencial')).toBeInTheDocument()
    expect(
      screen.getByDisplayValue('Campus Gustavo Galindo'),
    ).toBeInTheDocument()
  })

  it('creates a new event category', async () => {
    setCsrfCookie()

    let createdBody: unknown = null
    server.use(
      http.post(`${apiUrl}/admin/catalog/event-categories`, async ({ request }) => {
        createdBody = await request.json()

        return HttpResponse.json(
          { data: { id: 9, code: 'taller', name: 'Taller', is_active: true } },
          { status: 201 },
        )
      }),
    )

    const user = userEvent.setup()
    renderPage()

    const categoriesSection = (
      await screen.findByText('Categorías de eventos')
    ).closest('[data-slot="card"]')

    if (!(categoriesSection instanceof HTMLElement)) {
      throw new Error('Categories section not found')
    }

    await user.type(within(categoriesSection).getByLabelText('Código'), 'taller')
    await user.type(
      within(categoriesSection).getByLabelText('Nombre'),
      'Taller',
    )
    await user.click(within(categoriesSection).getByRole('button', { name: 'Agregar' }))

    await waitFor(() =>
      expect(createdBody).toEqual({ code: 'taller', name: 'Taller' }),
    )
  })

  it('toggles a location to inactive', async () => {
    setCsrfCookie()

    let updatedBody: unknown = null
    server.use(
      http.patch(`${apiUrl}/admin/catalog/locations/${location.id}`, async ({ request }) => {
        updatedBody = await request.json()

        return HttpResponse.json({
          data: { ...location, is_active: false },
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await screen.findByDisplayValue('Campus Gustavo Galindo')

    const locationsSection = (
      await screen.findByText('Ubicaciones')
    ).closest('[data-slot="card"]')

    if (!(locationsSection instanceof HTMLElement)) {
      throw new Error('Locations section not found')
    }

    await user.click(
      within(locationsSection).getByRole('button', { name: 'Desactivar' }),
    )

    await waitFor(() =>
      expect(updatedBody).toEqual({ is_active: false }),
    )
  })
})
