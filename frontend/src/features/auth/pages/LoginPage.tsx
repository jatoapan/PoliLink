import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { appRoutes } from '@/app/routes'
import { useAuth } from '@/features/auth/auth-context'
import { AuthPanel } from '@/features/auth/components/AuthPanel'
import {
  type LoginPayload,
  loginPayloadSchema,
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

export function LoginPage() {
  const { isLoggingIn, login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formError, setFormError] = useState<unknown>(null)
  const redirect = searchParams.get('redirect')
  const form = useForm<LoginPayload>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginPayloadSchema),
  })

  const onSubmit = async (payload: LoginPayload) => {
    setFormError(null)

    try {
      await login(payload)
      navigate(getSafeRedirect(redirect), { replace: true })
    } catch (error: unknown) {
      applyApiFieldErrors(error, form.setError)
      setFormError(error)
    }
  }

  return (
    <AuthPanel
      description="Ingresa para continuar con tu comunidad estudiantil."
      footer={
        <span>
          ¿Todavía no tienes una cuenta?{' '}
          <Link
            className="font-medium text-foreground underline underline-offset-4"
            to={buildAuthPath(appRoutes.register, redirect)}
          >
            Regístrate
          </Link>
        </span>
      }
      title="Inicia sesión"
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
              'No pudimos iniciar sesión. Intenta nuevamente.',
            )}
            title="No pudimos iniciar sesión"
          />
        )}

        <FieldGroup>
          <Field data-invalid={Boolean(form.formState.errors.email)}>
            <FieldLabel htmlFor="login-email">Correo electrónico</FieldLabel>
            <Input
              aria-describedby={
                form.formState.errors.email ? 'login-email-error' : undefined
              }
              aria-invalid={Boolean(form.formState.errors.email)}
              autoComplete="email"
              id="login-email"
              placeholder="correo@espol.edu.ec"
              type="email"
              {...form.register('email')}
            />
            <FieldError
              id="login-email-error"
              errors={[form.formState.errors.email]}
            />
          </Field>

          <Field data-invalid={Boolean(form.formState.errors.password)}>
            <FieldLabel htmlFor="login-password">Contraseña</FieldLabel>
            <Input
              aria-describedby={
                form.formState.errors.password
                  ? 'login-password-error'
                  : undefined
              }
              aria-invalid={Boolean(form.formState.errors.password)}
              autoComplete="current-password"
              id="login-password"
              type="password"
              {...form.register('password')}
            />
            <FieldError
              id="login-password-error"
              errors={[form.formState.errors.password]}
            />
          </Field>
        </FieldGroup>

        <Button
          className="w-full"
          disabled={isLoggingIn}
          size="lg"
          type="submit"
        >
          {isLoggingIn ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </AuthPanel>
  )
}
