import { ArrowRight, ClipboardCheck, Settings2 } from 'lucide-react'
import { Link } from 'react-router'

import { appRoutes } from '@/app/routes'
import { Badge } from '@/shared/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'

export function AdminPage() {
  return (
    <main className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-10">
        <header className="max-w-2xl space-y-4">
          <Badge variant="secondary">ESPOL · Administración</Badge>
          <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Panel de administración
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Gestiona lo que mantiene el catálogo de PoliLink funcionando: las
            solicitudes de nuevas comunidades y las opciones disponibles al
            publicar un evento.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-primary/30">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
                <ClipboardCheck aria-hidden="true" className="size-5" />
              </div>
              <CardTitle aria-level={2} role="heading">
                Solicitudes de comunidades
              </CardTitle>
              <CardDescription>
                Revisa las comunidades propuestas por estudiantes y decide si
                se aprueban o se rechazan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to={appRoutes.adminCommunityRequests}>
                  Revisar solicitudes
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
                <Settings2 aria-hidden="true" className="size-5" />
              </div>
              <CardTitle aria-level={2} role="heading">
                Catálogo del sistema
              </CardTitle>
              <CardDescription>
                Administra categorías, modalidades y ubicaciones disponibles
                para publicar eventos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to={appRoutes.adminCatalog}>
                  Administrar catálogo
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
