import { describe, expect, it } from 'vitest'

import { appRoutes } from '@/app/routes'
import {
  buildAuthPath,
  getSafeRedirect,
} from '@/features/auth/model/auth-helpers'

describe('auth redirect helpers', () => {
  it('keeps internal paths with query parameters and hashes', () => {
    expect(
      getSafeRedirect(`${appRoutes.eventDetail(7)}?view=details#registration`),
    ).toBe(`${appRoutes.eventDetail(7)}?view=details#registration`)
  })

  it('rejects external, protocol-relative, and auth-loop redirects', () => {
    expect(getSafeRedirect('https://evil.example')).toBe('/')
    expect(getSafeRedirect('//evil.example')).toBe('/')
    expect(getSafeRedirect(appRoutes.login)).toBe('/')
    expect(getSafeRedirect(appRoutes.register)).toBe('/')
  })

  it('preserves a safe redirect when linking between auth pages', () => {
    expect(
      buildAuthPath(
        appRoutes.register,
        `${appRoutes.eventDetail(7)}?view=details`,
      ),
    ).toBe(`${appRoutes.register}?redirect=%2Feventos%2F7%3Fview%3Ddetails`)
  })
})
