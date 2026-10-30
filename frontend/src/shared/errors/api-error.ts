export type ApiFieldErrors = Record<string, string[]>

export type ApiErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation'
  | 'rate_limited'
  | 'server'
  | 'unknown'

type ApiErrorPayload = {
  message?: unknown
  errors?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return isRecord(value)
}

function getApiErrorKind(status: number): ApiErrorKind {
  if (status === 0) return 'network'
  if (status === 401 || status === 419) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status === 422) return 'validation'
  if (status === 429) return 'rate_limited'
  if (status >= 500 && status <= 599) return 'server'

  return 'unknown'
}

function readMessage(payload: unknown, status: number): string {
  if (typeof payload === 'string' && payload.trim().length > 0) {
    return payload
  }

  if (isApiErrorPayload(payload) && typeof payload.message === 'string') {
    return payload.message
  }

  return `API request failed with status ${status}`
}

function readFieldErrors(payload: unknown): ApiFieldErrors {
  if (!isApiErrorPayload(payload)) return {}

  const errors = payload.errors

  if (!isRecord(errors)) return {}

  return Object.entries(errors).reduce<ApiFieldErrors>(
    (fieldErrors, [field, value]) => {
      if (typeof value === 'string') {
        fieldErrors[field] = [value]
        return fieldErrors
      }

      if (Array.isArray(value)) {
        const messages = value.filter(
          (message): message is string => typeof message === 'string',
        )

        if (messages.length > 0) fieldErrors[field] = messages
      }

      return fieldErrors
    },
    {},
  )
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number
  readonly payload: unknown
  readonly fieldErrors: ApiFieldErrors

  constructor(status: number, payload: unknown) {
    super(readMessage(payload, status))
    this.name = 'ApiError'
    this.kind = getApiErrorKind(status)
    this.status = status
    this.payload = payload
    this.fieldErrors = readFieldErrors(payload)
  }
}
