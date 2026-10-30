import { CheckCircle, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'

import { appRoutes } from '@/app/routes'
import { useAuth } from '@/features/auth/auth-context'
import { buildAuthPath } from '@/features/auth/model/auth-helpers'
import type { Event } from '@/features/events/model/event.schemas'
import {
  useCancelRegistration,
  useMyRegistrations,
  useRegisterForEvent,
} from '@/features/registrations/hooks/use-registration-queries'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

type EventRegistrationActionProps = {
  event: Event
}

type MutationOutcome = 'active' | 'cancelled' | null

const myRegistrationsPerPage = 50

export function EventRegistrationAction({
  event,
}: EventRegistrationActionProps) {
  const { status } = useAuth()
  const location = useLocation()
  const [outcome, setOutcome] = useState<MutationOutcome>(null)

  const registrationsQuery = useMyRegistrations(
    { perPage: myRegistrationsPerPage },
    { enabled: status === 'authenticated' },
  )
  const registerMutation = useRegisterForEvent()
  const cancelMutation = useCancelRegistration()

  if (event.status?.code === 'cancelled') {
    return (
      <Alert>
        <AlertTitle>Evento cancelado</AlertTitle>
        <AlertDescription>
          Este evento ya no acepta inscripciones.
        </AlertDescription>
      </Alert>
    )
  }

  if (status === 'loading') {
    return <Skeleton className="h-10 w-full" />
  }

  if (status !== 'authenticated') {
    return (
      <Button asChild className="w-full">
        <Link
          to={buildAuthPath(
            appRoutes.login,
            `${location.pathname}${location.search}`,
          )}
        >
          Inicia sesión para inscribirte
        </Link>
      </Button>
    )
  }

  if (registrationsQuery.isPending) {
    return <Skeleton className="h-10 w-full" />
  }

  const isRegistered =
    outcome === 'active' ||
    (outcome !== 'cancelled' &&
      registrationsQuery.data?.data.some(
        (registration) => registration.event?.id === event.id,
      ) === true)

  const handleRegister = async () => {
    try {
      await registerMutation.mutateAsync(event.id)
      setOutcome('active')
    } catch {
      // The mutation error is rendered below.
    }
  }

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(event.id)
      setOutcome('cancelled')
    } catch {
      // The mutation error is rendered below.
    }
  }

  if (isRegistered) {
    return (
      <div className="space-y-3">
        {outcome === 'active' && (
          <Alert>
            <CheckCircle aria-hidden="true" />
            <AlertTitle>Ya estás inscrito</AlertTitle>
            <AlertDescription>
              Puedes cancelar tu inscripción si ya no puedes asistir.
            </AlertDescription>
          </Alert>
        )}

        {cancelMutation.error !== null && (
          <ApiErrorFeedback
            error={cancelMutation.error}
            isRetrying={cancelMutation.isPending}
            messageOverrides={{
              not_found:
                'Tu inscripción ya no está activa. Actualiza la página.',
            }}
            title="No se pudo cancelar tu inscripción"
          />
        )}

        <Button
          className="w-full"
          disabled={cancelMutation.isPending}
          onClick={() => void handleCancel()}
          variant="outline"
        >
          {cancelMutation.isPending && (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          )}
          {cancelMutation.isPending
            ? 'Cancelando…'
            : 'Cancelar mi inscripción'}
        </Button>
      </div>
    )
  }

  const isFull = event.available_capacity === 0

  return (
    <div className="space-y-3">
      {registerMutation.error !== null && (
        <ApiErrorFeedback
          error={registerMutation.error}
          isRetrying={registerMutation.isPending}
          messageOverrides={{
            conflict:
              'No fue posible completar la inscripción. Revisa la disponibilidad del evento.',
          }}
          title="No se pudo completar la inscripción"
        />
      )}

      <Button
        className="w-full"
        disabled={isFull || registerMutation.isPending}
        onClick={() => void handleRegister()}
      >
        {registerMutation.isPending && (
          <LoaderCircle aria-hidden="true" className="animate-spin" />
        )}
        {isFull
          ? 'Cupos agotados'
          : registerMutation.isPending
            ? 'Inscribiendo…'
            : 'Inscribirme'}
      </Button>
    </div>
  )
}
