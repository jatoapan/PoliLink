import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { appRoutes } from '@/app/routes'
import { type AuthContextValue, useAuth } from '@/features/auth/auth-context'
import { CommunityOnboardingPage } from '@/features/organizer/pages/CommunityOnboardingPage'
import { server } from '@/test/server'

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)
const apiUrl = 'http://localhost:8000/api'

const community = {
  id: 4,
  name: 'Club de Robótica',
  slug: 'club-de-robotica',
  description: 'Comunidad de robótica de ESPOL.',
  image_url: null,
  status: { code: 'pending', name: 'Pendiente' },
  requested_at: '2026-08-16T20:00:00.000000Z',
  reviewed_at: null,
  rejection_reason: null,
}

function requestPage(data: unknown[] = []) {
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

function createAuthValue(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    user: {
      id: 7,
      first_name: 'Ana',
      last_name: 'Torres',
      email: 'ana@espol.edu.ec',
      is_admin: false,
      community_memberships: [],
    },
    status: 'authenticated',
    error: null,
    isLoggingIn: false,
    isRegistering: false,
    isLoggingOut: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(async () => undefined),
    ...overrides,
  }
}

function renderOnboarding() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[appRoutes.createCommunity]}>
        <Routes>
          <Route
            element={<CommunityOnboardingPage />}
            path={appRoutes.createCommunity}
          />
          <Route element={<div>organize page</div>} path={appRoutes.organize} />
          <Route
            element={<div>requests page</div>}
            path={appRoutes.communityRequests}
          />
          <Route
            element={<div>managed communities</div>}
            path={appRoutes.myCommunities}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function fillCommunityDetails(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByRole('textbox', { name: 'Nombre de la comunidad' }),
    'Club de Robótica',
  )
  await user.type(
    screen.getByRole('textbox', { name: /Descripción/ }),
    'Comunidad de robótica de ESPOL.',
  )
  await user.click(screen.getByRole('button', { name: 'Revisar información' }))
}

describe('community onboarding page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseAuth.mockReturnValue(createAuthValue())
    server.use(
      http.get(`${apiUrl}/me/community-creation-requests`, () =>
        HttpResponse.json(requestPage()),
      ),
    )
  })

  it('guides a student through the two steps and submits only after confirmation', async () => {
    let createRequests = 0
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'

    server.use(
      http.post(
        `${apiUrl}/community-creation-requests`,
        async ({ request }) => {
          createRequests += 1
          expect(await request.json()).toEqual({
            description: 'Comunidad de robótica de ESPOL.',
            name: 'Club de Robótica',
          })
          return HttpResponse.json({ data: community }, { status: 201 })
        },
      ),
    )

    const user = userEvent.setup()
    renderOnboarding()

    expect(
      screen.getByRole('heading', { name: 'Registra tu comunidad' }),
    ).toBeInTheDocument()
    await fillCommunityDetails(user)

    expect(
      screen.getByRole('heading', { name: 'Revisa antes de enviar' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect(
      screen.getByText(
        'Confirma que formas parte de esta comunidad para continuar.',
      ),
    ).toBeInTheDocument()
    expect(createRequests).toBe(0)

    await user.click(
      screen.getByRole('checkbox', {
        name: 'Confirmo que formo parte de esta comunidad y puedo representarla en PoliLink.',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    expect(await screen.findByText('requests page')).toBeInTheDocument()
    expect(createRequests).toBe(1)
  })

  it('previews and submits an optional image as multipart form data', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    const image = new File(['logo'], 'logo.webp', { type: 'image/webp' })

    server.use(
      http.post(
        `${apiUrl}/community-creation-requests`,
        async ({ request }) => {
          expect(request.headers.get('Content-Type')).toMatch(
            /^multipart\/form-data; boundary=/,
          )

          const formData = await request.formData()

          expect(formData.get('name')).toBe('Club de Robótica')
          expect(formData.get('image')).toMatchObject({ type: 'image/webp' })

          return HttpResponse.json({ data: community }, { status: 201 })
        },
      ),
    )

    const user = userEvent.setup()
    renderOnboarding()

    await user.type(
      screen.getByRole('textbox', { name: 'Nombre de la comunidad' }),
      'Club de Robótica',
    )
    await user.type(
      screen.getByRole('textbox', { name: /Descripción/ }),
      'Comunidad de robótica de ESPOL.',
    )

    await user.upload(screen.getByLabelText(/Imagen de la comunidad/), image)
    expect(screen.getByAltText('Vista previa de logo.webp')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Revisar información' }),
    )

    await user.click(screen.getByRole('checkbox', { name: /Confirmo/ }))
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    expect(await screen.findByText('requests page')).toBeInTheDocument()
  })

  it('shows the image validation error before moving to confirmation', async () => {
    const user = userEvent.setup({ applyAccept: false })
    const invalidImage = new File(['logo'], 'club-logo.gif', {
      type: 'image/gif',
    })
    renderOnboarding()

    await user.type(
      screen.getByRole('textbox', { name: 'Nombre de la comunidad' }),
      'Club de Robótica',
    )
    await user.upload(
      screen.getByLabelText('Imagen de la comunidad'),
      invalidImage,
    )
    await user.click(
      screen.getByRole('button', { name: 'Revisar información' }),
    )

    expect(
      await screen.findByText('La imagen debe ser JPG, PNG o WebP.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Revisa antes de enviar' }),
    ).not.toBeInTheDocument()
  })

  it('validates the community details before moving to confirmation', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    await user.click(
      screen.getByRole('button', { name: 'Revisar información' }),
    )

    expect(
      await screen.findByText('Ingresa el nombre de la comunidad.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Revisa antes de continuar' }),
    ).not.toBeInTheDocument()
  })

  it('returns to organize directly when the first step is empty', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    expect(
      screen.queryByRole('button', { name: 'Atrás' }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Volver a organizar' }))

    expect(screen.getByText('organize page')).toBeInTheDocument()
  })

  it('confirms before leaving when the form has unsaved details', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    await user.type(
      screen.getByRole('textbox', { name: 'Nombre de la comunidad' }),
      'Club de Robótica',
    )
    await user.click(screen.getByRole('button', { name: 'Volver a organizar' }))

    expect(
      screen.getByRole('heading', { name: '¿Salir del registro?' }),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Continuar registrando' }),
    )
    expect(
      screen.getByRole('textbox', { name: 'Nombre de la comunidad' }),
    ).toHaveValue('Club de Robótica')

    await user.click(screen.getByRole('button', { name: 'Volver a organizar' }))
    await user.click(screen.getByRole('button', { name: 'Salir' }))

    expect(screen.getByText('organize page')).toBeInTheDocument()
  })

  it('uses the second-step actions to edit or abandon the registration', async () => {
    const user = userEvent.setup()
    renderOnboarding()
    await fillCommunityDetails(user)

    await user.click(screen.getByRole('button', { name: 'Editar información' }))
    expect(
      screen.getByRole('heading', { name: 'Información básica' }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Revisar información' }),
    )
    await user.click(screen.getByRole('button', { name: 'Volver a organizar' }))
    expect(
      screen.getByRole('heading', { name: '¿Salir del registro?' }),
    ).toBeInTheDocument()
  })

  it('returns to the details step after a backend validation error', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'

    server.use(
      http.post(`${apiUrl}/community-creation-requests`, () =>
        HttpResponse.json(
          { errors: { name: ['Esta comunidad ya existe.'] } },
          { status: 422 },
        ),
      ),
    )

    const user = userEvent.setup()
    renderOnboarding()
    await fillCommunityDetails(user)
    await user.click(
      screen.getByRole('checkbox', {
        name: 'Confirmo que formo parte de esta comunidad y puedo representarla en PoliLink.',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    await waitFor(() => {
      expect(
        screen.getByRole('textbox', { name: 'Nombre de la comunidad' }),
      ).toHaveValue('Club de Robótica')
    })
    expect(screen.getByText('Esta comunidad ya existe.')).toBeInTheDocument()
    expect(screen.getByText('Revisa los datos ingresados.')).toBeInTheDocument()
  })
})
