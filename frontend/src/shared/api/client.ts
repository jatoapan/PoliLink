import { apiConfig } from '@/shared/config/env'
import { ApiError } from '@/shared/errors/api-error'

export type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

type UnauthorizedListener = () => void

const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const unauthorizedListeners = new Set<UnauthorizedListener>()
let csrfRequest: Promise<void> | null = null

function readCsrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined

  const cookie = document.cookie
    .split('; ')
    .find((value) => value.startsWith('XSRF-TOKEN='))

  return cookie
    ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length))
    : undefined
}

function applyCsrfHeader(headers: Headers): void {
  const token = readCsrfToken()

  if (token) headers.set('X-XSRF-TOKEN', token)
}

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData
}

function serializeRequestBody(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined
  if (isFormDataBody(body)) return body

  return JSON.stringify(body)
}

async function ensureCsrfCookie(): Promise<void> {
  if (readCsrfToken()) return

  const pendingRequest =
    csrfRequest ??
    (csrfRequest = requestCsrfCookie().finally(() => {
      csrfRequest = null
    }))

  await pendingRequest
}

function notifyUnauthorized(): void {
  for (const listener of unauthorizedListeners) listener()
}

async function fetchWithApiError(
  input: RequestInfo | URL,
  init: RequestInit,
): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch (error: unknown) {
    throw new ApiError(0, {
      cause: error instanceof Error ? error.message : 'Unknown network error',
      message: 'No se pudo conectar con la API de PoliLink.',
    })
  }
}

export function subscribeToUnauthorized(
  listener: UnauthorizedListener,
): () => void {
  unauthorizedListeners.add(listener)

  return () => unauthorizedListeners.delete(listener)
}

export async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text()

  if (text.length === 0) return undefined

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export async function request(
  path: string,
  options: RequestOptions = {},
): Promise<unknown> {
  const { body, ...requestOptions } = options
  const headers = new Headers(options.headers)
  const method = (options.method ?? 'GET').toUpperCase()
  const isMutating = mutatingMethods.has(method)
  const formDataBody = isFormDataBody(body)
  const requestBody = serializeRequestBody(body)

  headers.set('Accept', 'application/json')

  if (formDataBody) headers.delete('Content-Type')

  if (isMutating) {
    await ensureCsrfCookie()
    applyCsrfHeader(headers)
    if (!formDataBody) headers.set('Content-Type', 'application/json')
  }

  const requestInit: RequestInit = {
    ...requestOptions,
    ...(requestBody === undefined
      ? {}
      : { body: requestBody }),
    credentials: 'include',
    headers,
  }

  let response = await fetchWithApiError(
    `${apiConfig.apiUrl}${path}`,
    requestInit,
  )

  if (response.status === 419 && isMutating) {
    await requestCsrfCookie()
    applyCsrfHeader(headers)
    response = await fetchWithApiError(
      `${apiConfig.apiUrl}${path}`,
      requestInit,
    )
  }

  const payload = await readResponseBody(response)

  if (!response.ok) {
    if (response.status === 401) notifyUnauthorized()
    throw new ApiError(response.status, payload)
  }

  return payload
}

export async function requestCsrfCookie(): Promise<void> {
  const response = await fetchWithApiError(
    `${apiConfig.backendUrl}/sanctum/csrf-cookie`,
    {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    },
  )

  if (!response.ok) {
    throw new ApiError(response.status, await readResponseBody(response))
  }
}
