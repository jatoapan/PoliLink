import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'

describe('ApiErrorFeedback', () => {
  it('renders a controlled generic message and retry action', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()

    render(
      <ApiErrorFeedback
        error={new ApiError(500, { message: 'Internal SQL details' })}
        onRetry={onRetry}
        title="No pudimos cargar los datos"
      />,
    )

    expect(
      screen.getByText(
        'PoliLink no está disponible en este momento. Intenta nuevamente más tarde.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('Internal SQL details')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('supports a feature-specific message override', () => {
    render(
      <ApiErrorFeedback
        error={new ApiError(422, {})}
        messageOverrides={{ validation: 'Revisa los filtros.' }}
      />,
    )

    expect(screen.getByText('Revisa los filtros.')).toBeInTheDocument()
  })
})
