import { CalendarX, LoaderCircle } from 'lucide-react'
import { useState } from 'react'

import type { Registration } from '@/features/registrations/model/registration.schemas'
import { useCancelRegistration } from '@/features/registrations/hooks/use-registration-queries'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'

type CancelRegistrationDialogProps = {
  registration: Registration
}

export function CancelRegistrationDialog({
  registration,
}: CancelRegistrationDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const cancelMutation = useCancelRegistration()
  const eventTitle = registration.event?.title ?? 'este evento'

  const handleOpenChange = (nextOpen: boolean) => {
    if (cancelMutation.isPending) return

    setIsOpen(nextOpen)

    if (!nextOpen) cancelMutation.reset()
  }

  const handleCancel = async () => {
    if (registration.event === undefined) return

    try {
      await cancelMutation.mutateAsync(registration.event.id)
      cancelMutation.reset()
      setIsOpen(false)
    } catch {
      // The mutation error is rendered inside the confirmation dialog.
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogTrigger asChild>
        <Button
          aria-label={`Cancelar inscripción a ${eventTitle}`}
          size="sm"
          variant="outline"
        >
          <CalendarX aria-hidden="true" />
          Cancelar inscripción
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cancelar tu inscripción?</DialogTitle>
          <DialogDescription>
            Liberarás tu cupo en “{eventTitle}”. Podrás volver a inscribirte
            desde el detalle del evento mientras existan cupos disponibles.
          </DialogDescription>
        </DialogHeader>

        {cancelMutation.error !== null && (
          <ApiErrorFeedback
            error={cancelMutation.error}
            isRetrying={cancelMutation.isPending}
            messageOverrides={{
              not_found:
                'Esta inscripción ya no está activa. Actualiza la lista.',
            }}
            onRetry={() => void handleCancel()}
            title="No se pudo cancelar la inscripción"
          />
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={cancelMutation.isPending} variant="outline">
              Volver
            </Button>
          </DialogClose>
          <Button
            disabled={cancelMutation.isPending}
            onClick={() => void handleCancel()}
            variant="destructive"
          >
            {cancelMutation.isPending && (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            )}
            {cancelMutation.isPending
              ? 'Cancelando…'
              : 'Cancelar inscripción'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
