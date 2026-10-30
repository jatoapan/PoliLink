import { ArrowRight, CalendarPlus, UsersRound } from 'lucide-react'
import { Link } from 'react-router'

import { appRoutes } from '@/app/routes'
import { Button } from '@/shared/ui/button'

export function CommunityOrganizerActions({
  variant,
}: {
  variant: 'organizer' | 'visitor'
}) {
  if (variant === 'organizer') {
    return (
      <div
        aria-label="Acciones de organización"
        className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end"
        role="group"
      >
        <Button asChild className="flex-1 sm:flex-none" size="sm">
          <Link to={appRoutes.createEvent}>
            <CalendarPlus aria-hidden="true" />
            Crear evento
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <Button
          asChild
          className="flex-1 sm:flex-none"
          size="sm"
          variant="outline"
        >
          <Link to={appRoutes.myEvents}>Ver mis eventos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full shrink-0 sm:w-auto">
      <Button asChild className="w-full sm:w-auto" size="sm" variant="outline">
        <Link to={appRoutes.organize}>
          <UsersRound aria-hidden="true" />
          Conoce cómo organizar
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </div>
  )
}
