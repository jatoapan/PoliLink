import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { CommunityCreationRequestsSection } from '@/features/communities/components/CommunityCreationRequestsSection'
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

function renderSection() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CommunityCreationRequestsSection />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('community creation requests section', () => {
  beforeEach(() => {
    server.use(
      http.get(`${apiUrl}/me/community-creation-requests`, () =>
        HttpResponse.json(page([])),
      ),
    )
  })

  it('shows the empty state when the user has no requests', async () => {
    renderSection()

    expect(
      await screen.findByText('Todavía no tienes solicitudes'),
    ).toBeInTheDocument()
  })

  it('shows pending, approved, and rejected request states', async () => {
    const approvedRequest = {
      ...request,
      id: 9,
      name: 'Comunidad aprobada',
      slug: 'comunidad-aprobada',
      status: { code: 'approved', name: 'Aprobada' },
      community: {
        id: 14,
        name: 'Comunidad aprobada',
        slug: 'comunidad-aprobada',
        description: null,
        image_url: null,
      },
    }
    const rejectedRequest = {
      ...request,
      id: 10,
      name: 'Comunidad rechazada',
      slug: 'comunidad-rechazada',
      status: { code: 'rejected', name: 'Rechazada' },
      rejection_reason: 'La información necesita una corrección.',
    }

    server.use(
      http.get(`${apiUrl}/me/community-creation-requests`, () =>
        HttpResponse.json(page([request, approvedRequest, rejectedRequest])),
      ),
    )

    renderSection()

    expect(await screen.findByText('Club de Robótica')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Comunidad aprobada')).toBeInTheDocument()
    expect(screen.getByText('Aprobada')).toBeInTheDocument()
    expect(screen.getByText('Comunidad rechazada')).toBeInTheDocument()
    expect(screen.getByText('Rechazada')).toBeInTheDocument()
    expect(
      screen.getByText('La información necesita una corrección.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ver mis comunidades' }),
    ).toHaveAttribute('href', '/mis-comunidades')
  })

  it('shows a retry action when requests cannot be loaded', async () => {
    server.use(
      http.get(`${apiUrl}/me/community-creation-requests`, () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 }),
      ),
    )

    renderSection()

    expect(
      await screen.findByText('No pudimos cargar tus solicitudes'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument()
  })
})
