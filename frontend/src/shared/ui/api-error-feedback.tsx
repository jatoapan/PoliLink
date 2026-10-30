import { RefreshCw } from 'lucide-react'

import type { ApiErrorKind } from '@/shared/errors/api-error'
import { getApiErrorMessage } from '@/shared/errors/api-error-messages'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'

type ApiErrorFeedbackProps = {
  error: unknown
  title?: string
  message?: string
  fallback?: string
  messageOverrides?: Partial<Record<ApiErrorKind, string>>
  onRetry?: (() => void) | undefined
  retryLabel?: string
  isRetrying?: boolean
  variant?: 'default' | 'destructive'
}

export function ApiErrorFeedback({
  error,
  title = 'No pudimos completar la solicitud',
  message,
  fallback,
  messageOverrides,
  onRetry,
  retryLabel = 'Reintentar',
  isRetrying = false,
  variant = 'destructive',
}: ApiErrorFeedbackProps) {
  return (
    <Alert variant={variant}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-3">
        <span>
          {message ??
            getApiErrorMessage(
              error,
              fallback === undefined && messageOverrides === undefined
                ? undefined
                : {
                    ...(fallback === undefined ? {} : { fallback }),
                    ...(messageOverrides === undefined
                      ? {}
                      : { overrides: messageOverrides }),
                  },
            )}
        </span>
        {onRetry && (
          <Button
            disabled={isRetrying}
            onClick={onRetry}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              aria-hidden="true"
              className={isRetrying ? 'animate-spin' : undefined}
            />
            {isRetrying ? 'Reintentando…' : retryLabel}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
