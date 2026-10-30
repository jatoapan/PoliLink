export const appRoutes = {
  home: '/',
  login: '/iniciar-sesion',
  register: '/registrarse',
  events: '/eventos',
  eventDetail: (eventId: number | string) => `/eventos/${eventId}`,
  communities: '/comunidades',
  communityDetail: (slug: string) => `/comunidades/${slug}`,
  organize: '/organizar',
  createCommunity: '/crear-comunidad',
  communityRequests: '/mis-solicitudes',
  myCommunities: '/mis-comunidades',
  communityMembers: (communityId: number | string) =>
    `/mis-comunidades/${communityId}/miembros`,
  myEvents: '/mis-eventos',
  createEvent: '/crear-evento',
  editEvent: (eventId: number | string) => `/eventos/${eventId}/editar`,
  myRegistrations: '/mis-inscripciones',
  eventAttendees: (eventId: number | string) => `/eventos/${eventId}/inscritos`,
  legacyOrganizer: '/organizador',
  uiPreview: '/vista-previa',
  admin: '/admin',
  adminCommunityRequests: '/admin/solicitudes-comunidades',
  adminCatalog: '/admin/catalogo',
} as const

export const appRoutePatterns = {
  eventDetail: 'eventos/:eventId',
  eventEdit: 'eventos/:eventId/editar',
  eventAttendees: 'eventos/:eventId/inscritos',
  communityMembers: 'mis-comunidades/:communityId/miembros',
  communityDetail: 'comunidades/:communitySlug',
} as const

export type AuthRoute = typeof appRoutes.login | typeof appRoutes.register
