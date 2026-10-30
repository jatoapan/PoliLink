import { ApiError, type ApiErrorKind } from '@/shared/errors/api-error'

const defaultMessages: Record<ApiErrorKind, string> = {
  network: 'No pudimos conectarnos con PoliLink. Intenta nuevamente.',
  unauthorized: 'Tu sesión expiró. Inicia sesión nuevamente para continuar.',
  forbidden: 'No tienes permisos para realizar esta acción.',
  not_found: 'No encontramos la información solicitada.',
  conflict:
    'La información cambió o entra en conflicto. Revisa e inténtalo de nuevo.',
  validation: 'Revisa los datos ingresados.',
  rate_limited:
    'Hay demasiados intentos. Espera un momento y vuelve a intentarlo.',
  server:
    'PoliLink no está disponible en este momento. Intenta nuevamente más tarde.',
  unknown: 'Ocurrió un error inesperado. Intenta nuevamente.',
}

export type ApiErrorMessageOptions = {
  fallback?: string
  overrides?: Partial<Record<ApiErrorKind, string>>
}

export function getApiErrorMessage(
  error: unknown,
  options: ApiErrorMessageOptions = {},
): string {
  const { fallback = defaultMessages.unknown, overrides = {} } = options

  if (!(error instanceof ApiError)) return fallback

  return overrides[error.kind] ?? defaultMessages[error.kind] ?? fallback
}
