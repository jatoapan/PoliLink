import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { appRoutes } from '@/app/routes'
import { ManagedCommunitiesSection } from '@/features/organizer/components/ManagedCommunitiesSection'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'

const community = {
  id: 4,
  name: 'Club de Robótica',
  slug: 'club-de-robotica',
  description: 'Comunidad de robótica de ESPOL.',
  image_url: null,
}

function renderSection() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ManagedCommunitiesSection />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('managed communities section', () => {
  beforeEach(() => {
    server.use(
      http.get(`${apiUrl}/me/communities`, () =>
        HttpResponse.json({ data: [] }),
      ),
    )
  })

  it('links an empty dashboard to the community onboarding flow', async () => {
    renderSection()

    expect(
      await screen.findByRole('heading', {
        name: 'Aún no tienes comunidades',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Registrar una comunidad/ }),
    ).toHaveAttribute('href', appRoutes.createCommunity)
  })

  it('lists existing communities and links to register another one', async () => {
    server.use(
      http.get(`${apiUrl}/me/communities`, () =>
        HttpResponse.json({ data: [community] }),
      ),
    )

    renderSection()

    expect(await screen.findByText('Club de Robótica')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Registrar otra comunidad/ }),
    ).toHaveAttribute('href', appRoutes.createCommunity)
  })

  it('shows a retry action when communities cannot be loaded', async () => {
    server.use(
      http.get(`${apiUrl}/me/communities`, () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 }),
      ),
    )

    renderSection()

    expect(
      await screen.findByText('No pudimos cargar tus comunidades'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument()
  })
})
