import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'
import { getApiErrorMessage } from '@/shared/errors/api-error-messages'

describe('API error messages', () => {
  it.each([
    [0, 'network'],
    [401, 'unauthorized'],
    [419, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'conflict'],
    [422, 'validation'],
    [429, 'rate_limited'],
    [500, 'server'],
    [418, 'unknown'],
  ] as const)('classifies status %s as %s', (status, kind) => {
    expect(new ApiError(status, {}).kind).toBe(kind)
  })

  it('uses controlled messages instead of the backend message', () => {
    const error = new ApiError(500, {
      message: 'SQLSTATE[HY000]: database unavailable',
    })

    expect(getApiErrorMessage(error)).toBe(
      'PoliLink no está disponible en este momento. Intenta nuevamente más tarde.',
    )
  })

  it('allows a feature to override only a specific error kind', () => {
    const error = new ApiError(422, {})

    expect(
      getApiErrorMessage(error, {
        overrides: {
          validation: 'Los filtros enviados no son válidos.',
        },
      }),
    ).toBe('Los filtros enviados no son válidos.')
    expect(
      getApiErrorMessage(new ApiError(403, {}), {
        overrides: {
          validation: 'Los filtros enviados no son válidos.',
        },
      }),
    ).toBe('No tienes permisos para realizar esta acción.')
  })

  it('uses the fallback for errors outside the API error contract', () => {
    expect(
      getApiErrorMessage(new Error('Unexpected render failure'), {
        fallback: 'No pudimos completar la acción.',
      }),
    ).toBe('No pudimos completar la acción.')
  })
})
