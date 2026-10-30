export const adminCatalogQueryKeys = {
  all: ['admin', 'catalog'] as const,
  eventCategories: () =>
    [...adminCatalogQueryKeys.all, 'event-categories'] as const,
  eventModalities: () =>
    [...adminCatalogQueryKeys.all, 'event-modalities'] as const,
  locations: () => [...adminCatalogQueryKeys.all, 'locations'] as const,
}
