import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EventImage } from '@/features/events/components/EventImage'

describe('event image', () => {
  it('renders an event image with its alternative text', () => {
    render(
      <EventImage
        alt="Portada de Taller Laravel"
        imageUrl="https://example.com/laravel.webp"
      />,
    )

    expect(
      screen.getByRole('img', { name: 'Portada de Taller Laravel' }),
    ).toHaveAttribute('src', 'https://example.com/laravel.webp')
  })

  it('renders the icon fallback when there is no image URL', () => {
    const { container } = render(
      <EventImage alt="Portada de Taller Laravel" imageUrl={null} />,
    )

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(
      container.querySelector('[data-slot="event-image-fallback"]'),
    ).toBeInTheDocument()
  })

  it('renders the fallback after an image error and recovers for a new URL', () => {
    const { container, rerender } = render(
      <EventImage
        alt="Portada de Taller Laravel"
        imageUrl="https://example.com/invalid.webp"
      />,
    )
    const image = screen.getByRole('img')

    fireEvent.error(image)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(
      container.querySelector('[data-slot="event-image-fallback"]'),
    ).toBeInTheDocument()

    rerender(
      <EventImage
        alt="Portada de Taller Laravel"
        imageUrl="https://example.com/valid.webp"
      />,
    )

    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://example.com/valid.webp',
    )
  })
})
