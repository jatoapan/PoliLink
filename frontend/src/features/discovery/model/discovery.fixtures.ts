import type {
  DiscoveryCommunityResult,
  DiscoveryEventResult,
  DiscoveryResult,
} from '@/features/discovery/model/discovery.schemas'

export const discoveryEventFixture: DiscoveryEventResult = {
  id: 11,
  title: 'Taller de introducción a la inteligencia artificial con Python',
  description: 'Primeros pasos con modelos de aprendizaje automático.',
  image_url: null,
  starts_at: '2026-11-06T21:00:00.000000Z',
  capacity: 30,
  available_capacity: 29,
  category: { id: 1, code: 'workshop', name: 'Taller' },
  modality: { id: 1, code: 'in_person', name: 'Presencial' },
  location: { id: 2, name: 'Auditorio FIEC', description: null },
  community: {
    id: 3,
    name: 'Club de Inteligencia Artificial ESPOL',
    slug: 'club-de-inteligencia-artificial-espol',
    description: 'Estudiantes que exploran aprendizaje automático.',
  },
  status: { code: 'published', name: 'Publicado' },
  created_at: '2026-10-01T15:00:00.000000Z',
  updated_at: '2026-10-01T15:00:00.000000Z',
  reasons: [
    'El título menciona «inteligencia artificial».',
    'Modalidad presencial, como pediste.',
    'Es el viernes 6 de noviembre a las 16:00 (hora de Guayaquil), un día que pediste.',
    'Quedan 29 cupos disponibles.',
  ],
}

export const discoveryCommunityFixture: DiscoveryCommunityResult = {
  id: 4,
  name: 'Comunidad de Desarrollo Web ESPOL',
  slug: 'comunidad-de-desarrollo-web-espol',
  description: 'Estudiantes que programan aplicaciones web.',
  image_url: null,
  upcoming_events_count: 4,
  reasons: [
    'Su descripción menciona «programan».',
    'Tiene 4 eventos próximos publicados.',
  ],
}

export function discoveryResultFixture(
  overrides: Partial<DiscoveryResult> = {},
): DiscoveryResult {
  return {
    mode: 'ai',
    fallback_reason: null,
    interpretation: {
      intent: 'both',
      keywords: ['inteligencia artificial', 'programación'],
      categories: [],
      modalities: [{ code: 'in_person', name: 'Presencial' }],
      weekdays: [{ iso: 5, name: 'viernes' }],
    },
    events: [discoveryEventFixture],
    communities: [discoveryCommunityFixture],
    ...overrides,
  }
}
