import { describe, expect, it } from 'vitest'

import {
  eventFormSchema,
  toCreateEventPayload,
  toEventFormValues,
  toUpdateEventPayload,
} from '@/features/events/management/model/event-form.schemas'

const validValues = {
  capacity: '30',
  community_id: '4',
  description: 'Introducción práctica a Laravel.',
  event_category_id: '3',
  event_modality_id: '1',
  image: null,
  location_id: '1',
  starts_on: '2099-08-20',
  starts_time: '10:30',
  title: 'Taller Laravel',
}

describe('event form schema', () => {
  it('converts form strings into the backend event contract', () => {
    const values = eventFormSchema.parse(validValues)

    expect(toCreateEventPayload(values)).toEqual({
      capacity: 30,
      community_id: 4,
      description: 'Introducción práctica a Laravel.',
      event_category_id: 3,
      event_modality_id: 1,
      image: null,
      location_id: 1,
      starts_at: '2099-08-20T10:30:00-05:00',
      title: 'Taller Laravel',
    })
  })

  it('rejects a past event and invalid capacity', () => {
    const result = eventFormSchema.safeParse({
      ...validValues,
      capacity: '0',
      starts_on: '2020-01-01',
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Ingresa al menos un cupo.',
            path: ['capacity'],
          }),
          expect.objectContaining({
            message: 'La fecha y hora deben ser futuras.',
            path: ['starts_on'],
          }),
        ]),
      )
    }
  })

  it('rejects unsupported or oversized images', () => {
    const invalidType = new File(['logo'], 'logo.gif', { type: 'image/gif' })
    const result = eventFormSchema.safeParse({
      ...validValues,
      image: invalidType,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'La imagen debe ser JPG, PNG o WebP.',
      )
    }
  })

  it('preloads UTC event timestamps using ESPOL local time', () => {
    const values = toEventFormValues({
      id: 7,
      title: 'Taller Laravel',
      description: 'Introducción práctica a Laravel.',
      image_url: null,
      starts_at: '2099-08-20T15:30:00.000000Z',
      capacity: 30,
      available_capacity: 30,
      category: { id: 3, code: 'hackathon', name: 'Hackathon' },
      modality: { id: 1, code: 'in_person', name: 'Presencial' },
      location: { id: 1, name: 'Campus ESPOL', description: null },
      community: {
        id: 4,
        name: 'TAWS',
        slug: 'taws',
        description: 'Club de tecnología.',
      },
      status: { code: 'published', name: 'Publicado' },
      created_at: '2099-08-01T15:00:00.000000Z',
      updated_at: '2099-08-01T15:00:00.000000Z',
    })

    expect(values.starts_on).toBe('2099-08-20')
    expect(values.starts_time).toBe('10:30')
  })

  it('creates an update payload without image fields', () => {
    const values = eventFormSchema.parse(validValues)

    expect(toUpdateEventPayload(values)).toEqual({
      capacity: 30,
      community_id: 4,
      description: 'Introducción práctica a Laravel.',
      event_category_id: 3,
      event_modality_id: 1,
      location_id: 1,
      starts_at: '2099-08-20T10:30:00-05:00',
      title: 'Taller Laravel',
    })
  })
})
