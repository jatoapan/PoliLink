import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { AdminCommunityRequestsPage } from '@/features/admin/pages/AdminCommunityRequestsPage'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'

function setCsrfCookie() {
  document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
}

const pendingRequest = {
  id: 8,
  name: 'Club de Robótica',
  slug: 'club-de-robotica',
  description: 'Comunidad de robótica de ESPOL.',
  image_url: null,
  status: { code: 'pending', name: 'Pendiente' },
  requested_by: {
    id: 3,
    first_name: 'Ana',
    last_name: 'Torres',
    email: 'ana@espol.edu.ec',
  },
  community: null,
  requested_at: '2026-08-16T20:00:00.000000Z',
  reviewed_at: null,
  rejection_reason: null,
}

function page(data: unknown[]) {
  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 12,
      total: data.length,
    },
  }
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminCommunityRequestsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('admin community requests page', () => {
  beforeEach(() => {
    server.use(
      http.get(`${apiUrl}/admin/community-creation-requests`, () =>
        HttpResponse.json(page([pendingRequest])),
      ),
    )
  })

  it('lists pending requests with requester details and review actions', async () => {
    renderPage()

    expect(await screen.findByText('Club de Robótica')).toBeInTheDocument()
    expect(
      screen.getByText(/Solicitado por Ana Torres/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Rechazar solicitud de Club de Robótica',
      }),
    ).toBeInTheDocument()
  })

  it('shows an empty state when there are no requests for the selected status', async () => {
    server.use(
      http.get(`${apiUrl}/admin/community-creation-requests`, () =>
        HttpResponse.json(page([])),
      ),
    )

    renderPage()

    expect(
      await screen.findByText('No hay solicitudes en este estado'),
    ).toBeInTheDocument()
  })

  it('approves a pending request', async () => {
    setCsrfCookie()

    let approveCalled = false
    server.use(
      http.patch(
        `${apiUrl}/admin/community-creation-requests/${pendingRequest.id}/approve`,
        () => {
          approveCalled = true

          return HttpResponse.json({
            data: {
              ...pendingRequest,
              status: { code: 'approved', name: 'Aprobada' },
            },
          })
        },
      ),
    )

    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Aprobar' }))

    await waitFor(() => expect(approveCalled).toBe(true))
  })

  it('rejects a pending request with a reason', async () => {
    setCsrfCookie()

    let rejectedBody: unknown = null
    server.use(
      http.patch(
        `${apiUrl}/admin/community-creation-requests/${pendingRequest.id}/reject`,
        async ({ request }) => {
          rejectedBody = await request.json()

          return HttpResponse.json({
            data: {
              ...pendingRequest,
              status: { code: 'rejected', name: 'Rechazada' },
              rejection_reason: 'No cumple los requisitos.',
            },
          })
        },
      ),
    )

    const user = userEvent.setup()
    renderPage()

    await user.click(
      await screen.findByRole('button', {
        name: 'Rechazar solicitud de Club de Robótica',
      }),
    )
    await user.type(
      await screen.findByLabelText('Motivo del rechazo'),
      'No cumple los requisitos.',
    )
    await user.click(
      screen.getByRole('button', { name: 'Rechazar solicitud' }),
    )

    await waitFor(() =>
      expect(rejectedBody).toEqual({
        rejection_reason: 'No cumple los requisitos.',
      }),
    )
  })
})
