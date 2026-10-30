import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { appRoutes } from '@/app/routes'
import { CommunityCreationRequestsPage } from '@/features/communities/pages/CommunityCreationRequestsPage'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'

const request = {
  id: 8,
  name: 'Club de Robótica',
  slug: 'club-de-robotica',
  description: 'Comunidad de robótica de ESPOL.',
  image_url: null,
  status: { code: 'pending', name: 'Pendiente' },
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

function renderPage(
  state: { submittedRequest: { id: number; name: string } } | null = null,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[
          {
            pathname: appRoutes.communityRequests,
            state,
          },
        ]}
      >
        <CommunityCreationRequestsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('community creation requests page', () => {
  beforeEach(() => {
    server.use(
      http.get(`${apiUrl}/me/community-creation-requests`, () =>
        HttpResponse.json(page([request])),
      ),
    )
  })

  it('shows the submitted notice and keeps history separate from creation', async () => {
    renderPage({ submittedRequest: { id: request.id, name: request.name } })

    expect(
      screen.getByRole('heading', { name: 'Mis solicitudes', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Solicitud enviada')).toBeInTheDocument()
    expect(
      screen.getByText(/Recibimos la solicitud para «Club de Robótica»/),
    ).toBeInTheDocument()
    expect(await screen.findByText('Club de Robótica')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Registrar una comunidad' }),
    ).toHaveAttribute('href', appRoutes.createCommunity)
    expect(
      screen.queryByRole('heading', { name: 'Información básica' }),
    ).not.toBeInTheDocument()
  })

  it('shows an actionable empty state without a submission notice', async () => {
    server.use(
      http.get(`${apiUrl}/me/community-creation-requests`, () =>
        HttpResponse.json(page([])),
      ),
    )

    renderPage()

    expect(
      await screen.findByText('Todavía no tienes solicitudes'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Solicitud enviada')).not.toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: 'Registrar una comunidad' }),
    ).toHaveLength(2)
  })
})
