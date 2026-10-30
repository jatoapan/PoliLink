import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { appRoutes } from '@/app/routes'
import { useAuth } from '@/features/auth/auth-context'
import { AuthPanel } from '@/features/auth/components/AuthPanel'
import {
  type RegisterPayload,
  registerPayloadSchema,
} from '@/features/auth/model/auth.schemas'
import {
  getAuthErrorMessage,
} from '@/features/auth/model/auth-form-errors'
import {
  buildAuthPath,
  getSafeRedirect,
} from '@/features/auth/model/auth-helpers'
import { applyApiFieldErrors } from '@/shared/errors/form-errors'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Button } from '@/shared/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'

export function RegisterPage() {
  const { isRegistering, register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formError, setFormError] = useState<unknown>(null)
  const redirect = searchParams.get('redirect')
  const form = useForm<RegisterPayload>({
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      password_confirmation: '',
    },
    resolver: zodResolver(registerPayloadSchema),
  })

  const onSubmit = async (payload: RegisterPayload) => {
    setFormError(null)

    try {
      await register(payload)
      navigate(getSafeRedirect(redirect), { replace: true })
    } catch (error: unknown) {
      applyApiFieldErrors(error, form.setError)
      setFormError(error)
    }
  }

  return (
    <AuthPanel
      description="Crea una cuenta local para participar en las actividades de PoliLink."
      footer={
        <span>
          ¿Ya tienes una cuenta?{' '}
          <Link
            className="font-medium text-foreground underline underline-offset-4"
            to={buildAuthPath(appRoutes.login, redirect)}
          >
            Inicia sesión
          </Link>
        </span>
      }
      title="Crea tu cuenta"
    >
      <form
        className="space-y-5"
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {formError !== null && (
          <ApiErrorFeedback
            error={formError}
            message={getAuthErrorMessage(
              formError,
              'No pudimos crear tu cuenta. Intenta nuevamente.',
            )}
            title="No pudimos crear tu cuenta"
          />
        )}

        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field data-invalid={Boolean(form.formState.errors.first_name)}>
              <FieldLabel htmlFor="register-first-name">Nombres</FieldLabel>
              <Input
                aria-describedby={
                  form.formState.errors.first_name
                    ? 'register-first-name-error'
                    : undefined
                }
                aria-invalid={Boolean(form.formState.errors.first_name)}
                autoComplete="given-name"
                id="register-first-name"
                {...form.register('first_name')}
              />
              <FieldError
                id="register-first-name-error"
                errors={[form.formState.errors.first_name]}
              />
            </Field>

            <Field data-invalid={Boolean(form.formState.errors.last_name)}>
              <FieldLabel htmlFor="register-last-name">Apellidos</FieldLabel>
              <Input
                aria-describedby={
                  form.formState.errors.last_name
                    ? 'register-last-name-error'
                    : undefined
                }
                aria-invalid={Boolean(form.formState.errors.last_name)}
                autoComplete="family-name"
                id="register-last-name"
                {...form.register('last_name')}
              />
              <FieldError
                id="register-last-name-error"
                errors={[form.formState.errors.last_name]}
              />
            </Field>
          </div>

          <Field data-invalid={Boolean(form.formState.errors.email)}>
            <FieldLabel htmlFor="register-email">Correo electrónico</FieldLabel>
            <Input
              aria-describedby={
                form.formState.errors.email ? 'register-email-error' : undefined
              }
              aria-invalid={Boolean(form.formState.errors.email)}
              autoComplete="email"
              id="register-email"
              placeholder="correo@espol.edu.ec"
              type="email"
              {...form.register('email')}
            />
            <FieldError
              id="register-email-error"
              errors={[form.formState.errors.email]}
            />
          </Field>

          <Field data-invalid={Boolean(form.formState.errors.password)}>
            <FieldLabel htmlFor="register-password">Contraseña</FieldLabel>
            <Input
              aria-describedby={
                form.formState.errors.password
                  ? 'register-password-error'
                  : undefined
              }
              aria-invalid={Boolean(form.formState.errors.password)}
              autoComplete="new-password"
              id="register-password"
              type="password"
              {...form.register('password')}
            />
            <FieldError
              id="register-password-error"
              errors={[form.formState.errors.password]}
            />
          </Field>

          <Field
            data-invalid={Boolean(form.formState.errors.password_confirmation)}
          >
            <FieldLabel htmlFor="register-password-confirmation">
              Repite tu contraseña
            </FieldLabel>
            <Input
              aria-describedby={
                form.formState.errors.password_confirmation
                  ? 'register-password-confirmation-error'
                  : undefined
              }
              aria-invalid={Boolean(
                form.formState.errors.password_confirmation,
              )}
              autoComplete="new-password"
              id="register-password-confirmation"
              type="password"
              {...form.register('password_confirmation')}
            />
            <FieldError
              id="register-password-confirmation-error"
              errors={[form.formState.errors.password_confirmation]}
            />
          </Field>
        </FieldGroup>

        <Button
          className="w-full"
          disabled={isRegistering}
          size="lg"
          type="submit"
        >
          {isRegistering ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthPanel>
  )
}
