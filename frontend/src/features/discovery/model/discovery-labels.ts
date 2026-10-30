import type {
  DiscoveryIntent,
  DiscoveryResult,
  DiscoveryScope,
} from '@/features/discovery/model/discovery.schemas'

export const discoveryIntentLabels: Record<DiscoveryIntent, string> = {
  events: 'Eventos',
  communities: 'Comunidades',
  both: 'Eventos y comunidades',
}

const fallbackReasonMessages: Record<string, string> = {
  not_configured: 'El asistente de IA no está disponible en este momento.',
  rate_limited: 'El asistente de IA recibió demasiadas solicitudes.',
  timeout: 'El asistente de IA tardó demasiado en responder.',
}

export function getFallbackNotice(
  result: Pick<DiscoveryResult, 'fallback_reason'>,
): string {
  const cause =
    (result.fallback_reason &&
      fallbackReasonMessages[result.fallback_reason]) ??
    'El asistente de IA no pudo interpretar tu búsqueda.'

  return `${cause} Usamos una búsqueda por palabras clave, así que los resultados pueden ser menos precisos.`
}

export const discoveryExampleQueries: Record<
  DiscoveryScope,
  readonly string[]
> = {
  all: [
    'Me interesa la inteligencia artificial, quiero conocer gente que programe y prefiero actividades presenciales los viernes',
    'Talleres de programación web',
    'Charlas virtuales sobre ciberseguridad',
  ],
  events: [
    'Talleres presenciales de robótica los viernes',
    'Charlas virtuales sobre ciberseguridad',
    'Algo cultural para el fin de semana',
  ],
  communities: [
    'Quiero conocer gente que programe',
    'Grupos de música o danza',
    'Clubes de emprendimiento y sostenibilidad',
  ],
}
