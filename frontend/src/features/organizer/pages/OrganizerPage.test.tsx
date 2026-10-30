import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { appRoutes } from '@/app/routes'
import { OrganizerPage } from '@/features/organizer/pages/OrganizerPage'

vi.mock('@/features/organizer/components/ManagedCommunitiesSection', () => ({
  ManagedCommunitiesSection: () => <div>communities section</div>,
}))

describe('organizer page', () => {
  it('renders the managed communities dashboard shell', () => {
    render(
      <MemoryRouter>
        <OrganizerPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Mis comunidades' }),
    ).toBeInTheDocument()
    expect(screen.getByText('communities section')).toBeInTheDocument()
    expect(screen.getByText('Mis eventos')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Ver mis eventos/ }),
    ).toHaveAttribute('href', appRoutes.myEvents)
  })
})
