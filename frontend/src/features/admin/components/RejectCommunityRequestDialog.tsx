import { LoaderCircle, XCircle } from 'lucide-react'
import { useState } from 'react'

import { useRejectCommunityCreationRequest } from '@/features/communities/hooks/use-community-queries'
import {
  communityRejectionPayloadSchema,
  type CommunityCreationRequest,
} from '@/features/communities/model/community.schemas'
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
import { Field, FieldError, FieldLabel } from '@/shared/ui/field'
import { Textarea } from '@/shared/ui/textarea'

type RejectCommunityRequestDialogProps = {
  request: CommunityCreationRequest
}

export function RejectCommunityRequestDialog({
  request,
}: RejectCommunityRequestDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const rejectMutation = useRejectCommunityCreationRequest()

  const handleOpenChange = (nextOpen: boolean) => {
    if (rejectMutation.isPending) return

    setIsOpen(nextOpen)

    if (!nextOpen) {
      rejectMutation.reset()
      setReason('')
      setValidationError(null)
    }
  }

  const handleReject = async () => {
    const parsed = communityRejectionPayloadSchema.safeParse({
      rejection_reason: reason,
    })

    if (!parsed.success) {
      setValidationError(
        parsed.error.issues[0]?.message ?? 'Ingresa el motivo del rechazo.',
      )

      return
    }

    setValidationError(null)

    try {
      await rejectMutation.mutateAsync({
        requestId: request.id,
        rejectionReason: parsed.data.rejection_reason,
      })
      rejectMutation.reset()
      setIsOpen(false)
      setReason('')
    } catch {
      // The mutation error is rendered inside the dialog.
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogTrigger asChild>
        <Button
          aria-label={`Rechazar solicitud de ${request.name}`}
          size="sm"
          variant="destructive"
        >
          <XCircle aria-hidden="true" />
          Rechazar
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Rechazar solicitud?</DialogTitle>
          <DialogDescription>
            Explica por qué se rechaza la solicitud de «{request.name}». El
            estudiante verá este motivo.
          </DialogDescription>
        </DialogHeader>

        <Field data-invalid={Boolean(validationError)}>
          <FieldLabel htmlFor="rejection-reason">Motivo del rechazo</FieldLabel>
          <Textarea
            aria-describedby={
              validationError ? 'rejection-reason-error' : undefined
            }
            aria-invalid={Boolean(validationError)}
            id="rejection-reason"
            maxLength={1000}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ej. El nombre coincide con una comunidad existente."
            value={reason}
          />
          <FieldError id="rejection-reason-error">
            {validationError}
          </FieldError>
        </Field>

        {rejectMutation.error && (
          <ApiErrorFeedback
            error={rejectMutation.error}
            isRetrying={rejectMutation.isPending}
            onRetry={() => void handleReject()}
            title="No se pudo rechazar la solicitud"
          />
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={rejectMutation.isPending} variant="outline">
              Volver
            </Button>
          </DialogClose>
          <Button
            disabled={rejectMutation.isPending}
            onClick={() => void handleReject()}
            variant="destructive"
          >
            {rejectMutation.isPending && (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            )}
            {rejectMutation.isPending ? 'Rechazando…' : 'Rechazar solicitud'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
