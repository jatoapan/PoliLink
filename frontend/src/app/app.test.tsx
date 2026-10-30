import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from '@/App'

describe('application shell', () => {
  it('renders the public landing route', async () => {
    render(<App />)

    expect(
      await screen.findByRole('heading', {
        name: 'Vive ESPOL a través de sus comunidades',
      }),
    ).toBeInTheDocument()
  })
})
