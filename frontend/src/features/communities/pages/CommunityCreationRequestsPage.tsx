import { ArrowLeft, Plus } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { appRoutes } from '@/app/routes'
import { CommunityCreationRequestsSection } from '@/features/communities/components/CommunityCreationRequestsSection'
import type { CommunityRequestsNavigationState } from '@/features/communities/model/community-navigation'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'

export function CommunityCreationRequestsPage() {
  const location = useLocation()
  const navigationState =
    location.state as CommunityRequestsNavigationState | null
  const submittedRequest = navigationState?.submittedRequest

  return (
    <main className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <header className="space-y-5">
          <Button asChild className="-ml-2" variant="ghost">
            <Link to={appRoutes.organize}>
              <ArrowLeft aria-hidden="true" />
              Volver a organizar
            </Link>
          </Button>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                ESPOL · Comunidades estudiantiles
              </p>
              <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Mis solicitudes
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                Consulta el estado de las comunidades que has propuesto
                registrar.
              </p>
            </div>
            <Button asChild>
              <Link to={appRoutes.createCommunity}>
                <Plus aria-hidden="true" />
                Registrar una comunidad
              </Link>
            </Button>
          </div>
        </header>

        {submittedRequest && (
          <Alert aria-live="polite">
            <AlertTitle>Solicitud enviada</AlertTitle>
            <AlertDescription>
              Recibimos la solicitud para «{submittedRequest.name}». Un
              administrador revisará la información antes de activar la
              comunidad.
            </AlertDescription>
          </Alert>
        )}

        <CommunityCreationRequestsSection showHeader={false} />
      </div>
    </main>
  )
}
