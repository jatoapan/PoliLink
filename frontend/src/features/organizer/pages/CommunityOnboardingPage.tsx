import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Check, CircleCheck } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'

import { appRoutes } from '@/app/routes'
import { CommunityFormFields } from '@/features/communities/components/CommunityFormFields'
import { useSubmitCommunityCreationRequest } from '@/features/communities/hooks/use-community-queries'
import {
  type CommunityCreatePayload,
  communityCreatePayloadSchema,
} from '@/features/communities/model/community.schemas'
import { ApiError } from '@/shared/errors/api-error'
import { applyApiFieldErrors } from '@/shared/errors/form-errors'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

type OnboardingStep = 1 | 2

const steps = [
  { number: 1, label: 'Información básica' },
  { number: 2, label: 'Revisión y confirmación' },
] as const

function CommunityOnboardingProgress({ step }: { step: OnboardingStep }) {
  return (
    <ol aria-label="Progreso del registro" className="grid grid-cols-2 gap-2">
      {steps.map((item) => {
        const isCurrent = item.number === step
        const isComplete = item.number < step

        return (
          <li
            aria-current={isCurrent ? 'step' : undefined}
            className="space-y-2"
            key={item.number}
          >
            <div
              className={`h-1 rounded-full ${isComplete || isCurrent ? 'bg-primary' : 'bg-muted'}`}
            />
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] ${isComplete || isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                {isComplete ? <Check aria-hidden="true" /> : item.number}
              </span>
              <span
                className={
                  isCurrent
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground'
                }
              >
                {item.label}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function CommunityOnboardingPage() {
  const submitCommunityCreationRequest = useSubmitCommunityCreationRequest()
  const navigate = useNavigate()
  const [step, setStep] = useState<OnboardingStep>(1)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [confirmationError, setConfirmationError] = useState<string | null>(
    null,
  )
  const [formError, setFormError] = useState<unknown>(null)
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false)
  const form = useForm<CommunityCreatePayload>({
    defaultValues: {
      description: '',
      image: null,
      name: '',
    },
    resolver: zodResolver(communityCreatePayloadSchema),
  })
  const selectedImage = form.watch('image')
  const hasUnsavedDetails = form.formState.isDirty || Boolean(selectedImage)

  const handleDetailsContinue = async () => {
    const isValid = await form.trigger(['name', 'description', 'image'])

    if (isValid) {
      setFormError(null)
      setStep(2)
    }
  }

  const handleCreate = async (payload: CommunityCreatePayload) => {
    if (!isConfirmed) {
      setConfirmationError(
        'Confirma que formas parte de esta comunidad para continuar.',
      )
      return
    }

    setConfirmationError(null)
    setFormError(null)

    try {
      const request = await submitCommunityCreationRequest.mutateAsync({
        description: payload.description?.trim() || null,
        image: payload.image ?? null,
        name: payload.name.trim(),
      })

      navigate(appRoutes.communityRequests, {
        replace: true,
        state: {
          submittedRequest: {
            id: request.id,
            name: request.name,
          },
        },
      })
    } catch (error: unknown) {
      applyApiFieldErrors(error, form.setError)
      setFormError(error)

      if (error instanceof ApiError && error.kind === 'validation') {
        setStep(1)
      }
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (step === 1) {
      event.preventDefault()
      void handleDetailsContinue()
      return
    }

    if (step === 2) {
      void form.handleSubmit(handleCreate)(event)
    }
  }

  const handleBack = () => {
    setFormError(null)
    setConfirmationError(null)
    setIsConfirmed(false)
    setStep(1)
  }

  const handleExitRequest = () => {
    if (hasUnsavedDetails) {
      setIsExitDialogOpen(true)
      return
    }

    navigate(appRoutes.organize)
  }

  const handleExit = () => {
    setIsExitDialogOpen(false)
    navigate(appRoutes.organize)
  }

  return (
    <main className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="max-w-2xl space-y-3">
          <Button
            className="-ml-2"
            onClick={handleExitRequest}
            type="button"
            variant="ghost"
          >
            <ArrowLeft aria-hidden="true" />
            Volver a organizar
          </Button>
          <p className="text-sm font-medium text-muted-foreground">
            ESPOL · Organiza una comunidad
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Registra tu comunidad
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Completa estos pasos para conectar las actividades de tu comunidad
            con estudiantes de ESPOL.
          </p>
        </header>

        <CommunityOnboardingProgress step={step} />

        {formError !== null && (
          <ApiErrorFeedback
            error={formError}
            title="No pudimos enviar la solicitud"
          />
        )}

        <form noValidate onSubmit={handleSubmit}>
          <Card>
            {step === 1 && (
              <>
                <CardHeader>
                  <CardTitle aria-level={2} role="heading">
                    Información básica
                  </CardTitle>
                  <CardDescription>
                    Estos datos ayudarán a los estudiantes a reconocer tu
                    comunidad.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <CommunityFormFields
                    errors={form.formState.errors}
                    register={form.register}
                    selectedImage={selectedImage}
                    setValue={form.setValue}
                  />
                </CardContent>
              </>
            )}

            {step === 2 && (
              <>
                <CardHeader>
                  <CardTitle aria-level={2} role="heading">
                    Revisa antes de enviar
                  </CardTitle>
                  <CardDescription>
                    Confirma que la información representa a la comunidad que
                    coordinas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      Nombre de la comunidad
                    </p>
                    <p className="mt-1 font-medium">{form.getValues('name')}</p>
                    <p className="mt-4 text-sm text-muted-foreground">
                      Descripción
                    </p>
                    <p className="mt-1 text-sm">
                      {form.getValues('description') ||
                        'Sin descripción registrada.'}
                    </p>
                    {selectedImage && (
                      <>
                        <p className="mt-4 text-sm text-muted-foreground">
                          Imagen
                        </p>
                        <p className="mt-1 truncate text-sm">
                          {selectedImage.name}
                        </p>
                      </>
                    )}
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm leading-relaxed transition-colors hover:bg-muted/50">
                    <input
                      aria-describedby={
                        confirmationError
                          ? 'community-confirmation-error'
                          : undefined
                      }
                      checked={isConfirmed}
                      className="mt-1 size-4 accent-primary"
                      onChange={(event) => {
                        setIsConfirmed(event.target.checked)
                        setConfirmationError(null)
                      }}
                      type="checkbox"
                    />
                    <span>
                      Confirmo que formo parte de esta comunidad y puedo
                      representarla en PoliLink.
                    </span>
                  </label>
                  {confirmationError && (
                    <p
                      className="text-sm text-destructive"
                      id="community-confirmation-error"
                      role="alert"
                    >
                      {confirmationError}
                    </p>
                  )}
                </CardContent>
              </>
            )}

            <div
              className={`flex flex-col-reverse gap-2 border-t bg-muted/20 p-4 sm:flex-row sm:items-center ${step === 1 ? 'sm:justify-end' : 'sm:justify-between'}`}
            >
              {step === 2 && (
                <Button
                  disabled={submitCommunityCreationRequest.isPending}
                  onClick={handleBack}
                  type="button"
                  variant="ghost"
                >
                  <ArrowLeft aria-hidden="true" />
                  Editar información
                </Button>
              )}
              {step === 1 && (
                <Button type="submit">
                  Revisar información
                  <ArrowRight aria-hidden="true" />
                </Button>
              )}
              {step === 2 && (
                <Button
                  disabled={submitCommunityCreationRequest.isPending}
                  type="submit"
                >
                  {submitCommunityCreationRequest.isPending
                    ? 'Enviando solicitud…'
                    : 'Enviar solicitud'}
                  {!submitCommunityCreationRequest.isPending && (
                    <CircleCheck aria-hidden="true" />
                  )}
                </Button>
              )}
            </div>
          </Card>
        </form>

        <Dialog onOpenChange={setIsExitDialogOpen} open={isExitDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Salir del registro?</DialogTitle>
              <DialogDescription>
                Perderás la información ingresada y tendrás que comenzar
                nuevamente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Continuar registrando</Button>
              </DialogClose>
              <Button onClick={handleExit} variant="destructive">
                Salir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
