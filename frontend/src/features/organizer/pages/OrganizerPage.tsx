import { ArrowRight, CalendarDays } from 'lucide-react'
import { Link } from 'react-router'

import { appRoutes } from '@/app/routes'
import { ManagedCommunitiesSection } from '@/features/organizer/components/ManagedCommunitiesSection'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'

export function OrganizerPage() {
  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="max-w-2xl space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            ESPOL · Mis comunidades
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Mis comunidades
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Administra las comunidades que coordinas y prepara sus próximas
            actividades para la comunidad estudiantil de ESPOL.
          </p>
        </header>

        <ManagedCommunitiesSection />

        <section aria-label="Gestión de eventos" className="grid gap-4">
          <Card>
            <CardHeader>
              <CalendarDays
                aria-hidden="true"
                className="mb-2 size-5 text-muted-foreground"
              />
              <CardTitle>Mis eventos</CardTitle>
              <CardDescription>
                Revisa y organiza las actividades publicadas por tus
                comunidades.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to={appRoutes.createEvent}>
                    Crear evento
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to={appRoutes.myEvents}>Ver mis eventos</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
