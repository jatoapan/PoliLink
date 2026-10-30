import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { CommunityDirectoryPage } from '@/features/communities/pages/CommunityDirectoryPage'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'

const taws = {
  id: 4,
  name: 'TAWS',
  slug: 'taws',
  description: 'Comunidad de desarrollo web de ESPOL.',
  image_url: null,
}

const ciap = {
  id: 5,
  name: 'CIAP',
  slug: 'ciap',
  description: null,
  image_url: null,
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
      <MemoryRouter initialEntries={['/comunidades']}>
        <CommunityDirectoryPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('community directory page', () => {
  beforeEach(() => {
    server.use(
      http.get(`${apiUrl}/communities/discover`, ({ request }) => {
        const query = new URL(request.url).searchParams
        const search = query.get('search')

        if (search) {
          return HttpResponse.json(
            page([taws, ciap].filter((community) => community.name.toLowerCase().includes(search.toLowerCase()))),
          )
        }

        return HttpResponse.json(page([taws, ciap]))
      }),
    )
  })

  it('lists active communities', async () => {
    renderPage()

    expect(await screen.findByText('TAWS')).toBeInTheDocument()
    expect(screen.getByText('CIAP')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ver detalles de TAWS' }),
    ).toHaveAttribute('href', '/comunidades/taws')
  })

  it('filters communities as the user types a search term', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('TAWS')

    await user.type(
      screen.getByPlaceholderText('Buscar comunidades por nombre…'),
      'ciap',
    )

    await waitFor(() => {
      expect(screen.queryByText('TAWS')).not.toBeInTheDocument()
    })
    expect(screen.getByText('CIAP')).toBeInTheDocument()
  })

  it('shows an empty state when no communities match', async () => {
    server.use(
      http.get(`${apiUrl}/communities/discover`, () =>
        HttpResponse.json(page([])),
      ),
    )

    renderPage()

    expect(
      await screen.findByText('No encontramos comunidades'),
    ).toBeInTheDocument()
  })
})
