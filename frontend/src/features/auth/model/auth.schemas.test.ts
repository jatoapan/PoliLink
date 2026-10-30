import { describe, expect, it } from 'vitest'

import {
  espolEmailSchema,
  loginPayloadSchema,
  registerPayloadSchema,
} from '@/features/auth/model/auth.schemas'

const validRegisterPayload = {
  first_name: 'Ana',
  last_name: 'Torres',
  email: 'ana@espol.edu.ec',
  password: 'password123',
  password_confirmation: 'password123',
}

describe('authentication schemas', () => {
  it('accepts ESPOL email addresses case-insensitively', () => {
    expect(espolEmailSchema.safeParse('ana@espol.edu.ec').success).toBe(true)
    expect(espolEmailSchema.safeParse('ANA@ESPOL.EDU.EC').success).toBe(true)
  })

  it('rejects non-ESPOL email addresses and ESPOL subdomains', () => {
    expect(espolEmailSchema.safeParse('ana@gmail.com').success).toBe(false)
    expect(espolEmailSchema.safeParse('ana@clubs.espol.edu.ec').success).toBe(
      false,
    )
  })

  it('applies the domain rule to both register and login payloads', () => {
    expect(registerPayloadSchema.safeParse(validRegisterPayload).success).toBe(
      true,
    )
    expect(
      loginPayloadSchema.safeParse({
        email: 'ana@gmail.com',
        password: 'password123',
      }).success,
    ).toBe(false)
  })

  it('rejects registration when passwords do not match', () => {
    expect(
      registerPayloadSchema.safeParse({
        ...validRegisterPayload,
        password_confirmation: 'different-password',
      }).success,
    ).toBe(false)
  })
})
