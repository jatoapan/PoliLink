import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { appRoutes } from '@/app/routes'
import { CatalogResourceSection } from '@/features/admin/components/CatalogResourceSection'
import {
  useAdminEventCategories,
  useAdminEventModalities,
  useAdminLocations,
  useCreateAdminEventCategory,
  useCreateAdminEventModality,
  useCreateAdminLocation,
  useUpdateAdminEventCategory,
  useUpdateAdminEventModality,
  useUpdateAdminLocation,
} from '@/features/admin/hooks/use-catalog-admin-queries'
import {
  createCatalogCodedResourcePayloadSchema,
  createLocationPayloadSchema,
} from '@/features/admin/model/catalog-admin.schemas'
import { Button } from '@/shared/ui/button'

function useCatalogRowState() {
  const [savingId, setSavingId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  return { savingId, setSavingId, togglingId, setTogglingId }
}

function EventCategoriesSection() {
  const categoriesQuery = useAdminEventCategories()
  const createMutation = useCreateAdminEventCategory()
  const updateMutation = useUpdateAdminEventCategory()
  const { savingId, setSavingId, togglingId, setTogglingId } =
    useCatalogRowState()

  return (
    <CatalogResourceSection
      createError={createMutation.error}
      description="Clasifican los eventos publicados en el catálogo público."
      error={categoriesQuery.error}
      hasCode
      idPrefix="event-category"
      isCreating={createMutation.isPending}
      isError={categoriesQuery.isError}
      isLoading={categoriesQuery.isPending}
      items={categoriesQuery.data}
      onCreate={async ({ code, name }) => {
        const parsed = createCatalogCodedResourcePayloadSchema.safeParse({
          code,
          name,
        })

        if (!parsed.success) return false

        try {
          await createMutation.mutateAsync(parsed.data)

          return true
        } catch {
          return false
        }
      }}
      onRetry={() => void categoriesQuery.refetch()}
      onToggleActive={async (id, nextActive) => {
        setTogglingId(id)

        try {
          await updateMutation.mutateAsync({
            id,
            payload: { is_active: nextActive },
          })
        } finally {
          setTogglingId(null)
        }
      }}
      onUpdateName={async (id, values) => {
        setSavingId(id)

        try {
          await updateMutation.mutateAsync({
            id,
            payload: { name: values.name.trim() },
          })
        } finally {
          setSavingId(null)
        }
      }}
      savingId={savingId}
      title="Categorías de eventos"
      togglingId={togglingId}
    />
  )
}

function EventModalitiesSection() {
  const modalitiesQuery = useAdminEventModalities()
  const createMutation = useCreateAdminEventModality()
  const updateMutation = useUpdateAdminEventModality()
  const { savingId, setSavingId, togglingId, setTogglingId } =
    useCatalogRowState()

  return (
    <CatalogResourceSection
      createError={createMutation.error}
      description="Definen cómo se desarrolla un evento: presencial, virtual o híbrido, por ejemplo."
      error={modalitiesQuery.error}
      hasCode
      idPrefix="event-modality"
      isCreating={createMutation.isPending}
      isError={modalitiesQuery.isError}
      isLoading={modalitiesQuery.isPending}
      items={modalitiesQuery.data}
      onCreate={async ({ code, name }) => {
        const parsed = createCatalogCodedResourcePayloadSchema.safeParse({
          code,
          name,
        })

        if (!parsed.success) return false

        try {
          await createMutation.mutateAsync(parsed.data)

          return true
        } catch {
          return false
        }
      }}
      onRetry={() => void modalitiesQuery.refetch()}
      onToggleActive={async (id, nextActive) => {
        setTogglingId(id)

        try {
          await updateMutation.mutateAsync({
            id,
            payload: { is_active: nextActive },
          })
        } finally {
          setTogglingId(null)
        }
      }}
      onUpdateName={async (id, values) => {
        setSavingId(id)

        try {
          await updateMutation.mutateAsync({
            id,
            payload: { name: values.name.trim() },
          })
        } finally {
          setSavingId(null)
        }
      }}
      savingId={savingId}
      title="Modalidades de eventos"
      togglingId={togglingId}
    />
  )
}

function LocationsSection() {
  const locationsQuery = useAdminLocations()
  const createMutation = useCreateAdminLocation()
  const updateMutation = useUpdateAdminLocation()
  const { savingId, setSavingId, togglingId, setTogglingId } =
    useCatalogRowState()

  return (
    <CatalogResourceSection
      createError={createMutation.error}
      description="Ubicaciones disponibles dentro y fuera del campus para los eventos."
      error={locationsQuery.error}
      hasCode={false}
      hasDescription
      idPrefix="location"
      isCreating={createMutation.isPending}
      isError={locationsQuery.isError}
      isLoading={locationsQuery.isPending}
      items={locationsQuery.data}
      onCreate={async ({ name, description }) => {
        const parsed = createLocationPayloadSchema.safeParse({
          name,
          description: description.trim() || null,
        })

        if (!parsed.success) return false

        try {
          await createMutation.mutateAsync(parsed.data)

          return true
        } catch {
          return false
        }
      }}
      onRetry={() => void locationsQuery.refetch()}
      onToggleActive={async (id, nextActive) => {
        setTogglingId(id)

        try {
          await updateMutation.mutateAsync({
            id,
            payload: { is_active: nextActive },
          })
        } finally {
          setTogglingId(null)
        }
      }}
      onUpdateName={async (id, values) => {
        setSavingId(id)

        try {
          await updateMutation.mutateAsync({
            id,
            payload: {
              name: values.name.trim(),
              description: values.description.trim() || null,
            },
          })
        } finally {
          setSavingId(null)
        }
      }}
      savingId={savingId}
      title="Ubicaciones"
      togglingId={togglingId}
    />
  )
}

export function AdminCatalogPage() {
  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="space-y-5">
          <Button asChild className="-ml-2" variant="ghost">
            <Link to={appRoutes.admin}>
              <ArrowLeft aria-hidden="true" />
              Volver a administración
            </Link>
          </Button>
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              ESPOL · Administración
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Catálogo del sistema
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Mantén las categorías, modalidades y ubicaciones disponibles
              para publicar eventos. Desactivar un registro lo oculta de los
              formularios sin eliminar su historial.
            </p>
          </div>
        </header>

        <div className="space-y-6">
          <EventCategoriesSection />
          <EventModalitiesSection />
          <LocationsSection />
        </div>
      </div>
    </main>
  )
}
