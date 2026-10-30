import {
  ArrowRight,
  CalendarPlus,
  ClipboardList,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router'

import { appRoutes } from '@/app/routes'
import { useAuth } from '@/features/auth/auth-context'
import { hasRole } from '@/features/auth/model/auth-helpers'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'

export function OrganizePage() {
  const { user } = useAuth()
  const isOrganizer = hasRole(user, 'organizer')

  return (
    <main className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-10">
        <header className="max-w-2xl space-y-4">
          <Badge variant="secondary">ESPOL · Comunidades estudiantiles</Badge>
          <h1 className="font-heading text-4xl leading-[1.05] font-semibold tracking-[-0.05em] sm:text-6xl">
            Organiza las actividades de tu comunidad
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Conecta a tu comunidad con estudiantes de ESPOL y comparte sus
            talleres, encuentros y actividades desde PoliLink.
          </p>
        </header>

        <section aria-labelledby="organize-options-title" className="space-y-4">
          <div>
            <h2
              className="font-heading text-xl font-medium"
              id="organize-options-title"
            >
              ¿Qué quieres hacer?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Elige la opción que mejor describe tu comunidad.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-primary/30">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
                  <UsersRound aria-hidden="true" className="size-5" />
                </div>
                <CardTitle aria-level={2} role="heading">
                  {isOrganizer
                    ? 'Registra otra comunidad'
                    : 'Registra una comunidad nueva'}
                </CardTitle>
                <CardDescription>
                  {isOrganizer
                    ? 'Añade otra comunidad que coordinas en PoliLink.'
                    : 'Para estudiantes que forman parte de una comunidad y coordinan sus actividades.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link to={appRoutes.createCommunity}>
                    {isOrganizer
                      ? 'Registrar otra comunidad'
                      : 'Comenzar registro'}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground">
                  <CalendarPlus aria-hidden="true" className="size-5" />
                </div>
                <CardTitle aria-level={2} role="heading">
                  Mi comunidad ya está en PoliLink
                </CardTitle>
                <CardDescription>
                  Pronto podrás encontrar una comunidad existente y conectar tu
                  experiencia con ella.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button disabled variant="outline">
                  Disponible próximamente
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="flex flex-col gap-3 rounded-xl border border-dashed p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-base font-medium">
                {isOrganizer
                  ? '¿Quieres revisar tus comunidades?'
                  : '¿Prefieres descubrir actividades primero?'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isOrganizer
                  ? 'Consulta las comunidades que ya administras en PoliLink.'
                  : 'Explora el catálogo público antes de comenzar.'}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link
                to={isOrganizer ? appRoutes.myCommunities : appRoutes.events}
              >
                {isOrganizer ? 'Ver mis comunidades' : 'Explorar eventos'}
              </Link>
            </Button>
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-dashed p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ClipboardList
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              />
              <div>
                <h2 className="font-heading text-base font-medium">
                  ¿Ya enviaste una solicitud?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Consulta su estado y el historial de tus propuestas.
                </p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to={appRoutes.communityRequests}>Ver mis solicitudes</Link>
            </Button>
          </section>
        </div>
      </div>
    </main>
  )
}
