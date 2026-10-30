import { getApiErrorMessage } from '@/shared/errors/api-error-messages'

export function getAuthErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return getApiErrorMessage(error, {
    fallback,
    overrides: {
      unauthorized: 'El correo o la contraseña no son correctos.',
    },
  })
}
