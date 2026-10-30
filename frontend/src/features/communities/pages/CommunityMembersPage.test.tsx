import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { appRoutePatterns, appRoutes } from '@/app/routes'
import { CommunityMembersPage } from '@/features/communities/pages/CommunityMembersPage'
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
  description: null,
  image_url: null,
}

const pendingMembership = {
  id: 55,
  community,
  role: { code: 'member', name: 'Miembro' },
  status: { code: 'pending', name: 'Pendiente' },
  requested_by: {
    id: 9,
    first_name: 'Ana',
    last_name: 'Torres',
    email: 'ana@espol.edu.ec',
  },
  requested_at: '2026-08-16T20:00:00.000000Z',
  reviewed_at: null,
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
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[appRoutes.communityMembers(4)]}>
        <Routes>
          <Route
            element={<CommunityMembersPage />}
            path={`/${appRoutePatterns.communityMembers}`}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('community members page', () => {
  beforeEach(() => {
    server.use(
      http.get(`${apiUrl}/me/communities`, () =>
        HttpResponse.json({ data: [community] }),
      ),
      http.get(`${apiUrl}/communities/4/membership-requests`, () =>
        HttpResponse.json(page([pendingMembership])),
      ),
    )
  })

  it('shows pending membership requests with requester details', async () => {
    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Miembros de TAWS' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Ana Torres')).toBeInTheDocument()
    expect(screen.getByText('ana@espol.edu.ec')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument()
  })

  it('approves a pending membership request', async () => {
    setCsrfCookie()

    let approveCalled = false
    server.use(
      http.patch(`${apiUrl}/community-memberships/55/approve`, () => {
        approveCalled = true

        return HttpResponse.json({
          data: { ...pendingMembership, status: { code: 'active', name: 'Activa' } },
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Aprobar' }))

    await waitFor(() => expect(approveCalled).toBe(true))
  })

  it('rejects a pending membership request', async () => {
    setCsrfCookie()

    let rejectCalled = false
    server.use(
      http.patch(`${apiUrl}/community-memberships/55/reject`, () => {
        rejectCalled = true

        return HttpResponse.json({
          data: { ...pendingMembership, status: { code: 'rejected', name: 'Rechazada' } },
        })
      }),
    )

    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Rechazar' }))

    await waitFor(() => expect(rejectCalled).toBe(true))
  })

  it('shows an empty state when there are no requests for the selected status', async () => {
    server.use(
      http.get(`${apiUrl}/communities/4/membership-requests`, () =>
        HttpResponse.json(page([])),
      ),
    )

    renderPage()

    expect(
      await screen.findByText('No hay solicitudes en este estado'),
    ).toBeInTheDocument()
  })
})
