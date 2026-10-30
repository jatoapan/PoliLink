export const organizerQueryKeys = {
  all: ['organizer'] as const,
  communities: () => [...organizerQueryKeys.all, 'communities'] as const,
  eventsRoot: () => [...organizerQueryKeys.all, 'events'] as const,
  events: (page: number, perPage: number) =>
    [...organizerQueryKeys.eventsRoot(), { page, perPage }] as const,
}
