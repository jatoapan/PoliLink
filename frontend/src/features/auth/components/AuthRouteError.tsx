import { useState } from 'react'

import { useAuth } from '@/features/auth/auth-context'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'

export function AuthRouteError() {
  const { error, refresh } = useAuth()
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    setIsRetrying(true)

    try {
      await refresh()
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-xl">
        <ApiErrorFeedback
          error={error}
          isRetrying={isRetrying}
          message="Intenta cargar nuevamente tu sesión para continuar."
          onRetry={() => void handleRetry()}
          title="No pudimos verificar tu sesión"
        />
      </div>
    </main>
  )
}
