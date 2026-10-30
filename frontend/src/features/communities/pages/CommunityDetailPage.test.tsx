import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'

import { appRoutePatterns, appRoutes } from '@/app/routes'
import { AuthProvider } from '@/features/auth/auth-context'
import { CommunityDetailPage } from '@/features/communities/pages/CommunityDetailPage'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'

const taws = {
  id: 4,
  name: 'TAWS',
  slug: 'taws',
  description: 'Comunidad de desarrollo web de ESPOL.',
  image_url: null,
}

function renderDetail(slug: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[appRoutes.communityDetail(slug)]}>
          <Routes>
            <Route
              element={<CommunityDetailPage />}
              path={`/${appRoutePatterns.communityDetail}`}
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('community detail page', () => {
  it('renders the community details and a link to its events', async () => {
    server.use(
      http.get(`${apiUrl}/communities/taws`, () =>
        HttpResponse.json({ data: taws }),
      ),
    )

    renderDetail('taws')

    expect(
      await screen.findByRole('heading', { name: 'TAWS' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Comunidad de desarrollo web de ESPOL.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Ver eventos de TAWS/ }),
    ).toHaveAttribute('href', '/eventos?community_id=4')
  })

  it('prompts anonymous users to sign in before joining the community', async () => {
    server.use(
      http.get(`${apiUrl}/communities/taws`, () =>
        HttpResponse.json({ data: taws }),
      ),
    )

    renderDetail('taws')

    expect(
      await screen.findByRole('link', {
        name: 'Inicia sesión para unirte a TAWS',
      }),
    ).toHaveAttribute('href', expect.stringContaining(appRoutes.login))
  })

  it('shows a not-found state for an unknown community', async () => {
    server.use(
      http.get(`${apiUrl}/communities/no-existe`, () =>
        HttpResponse.json({ message: 'No encontrado.' }, { status: 404 }),
      ),
    )

    renderDetail('no-existe')

    expect(
      await screen.findByRole('heading', { name: 'Comunidad no encontrada' }),
    ).toBeInTheDocument()
  })
})
