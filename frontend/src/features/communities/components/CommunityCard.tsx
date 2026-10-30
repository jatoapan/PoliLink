import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

import { appRoutes } from '@/app/routes'
import type { Community } from '@/features/communities/model/community.schemas'
import { EventImage } from '@/features/events/components/EventImage'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'

type CommunityCardProps = {
  community: Community
}

export function CommunityCard({ community }: CommunityCardProps) {
  return (
    <Link
      aria-label={`Ver detalles de ${community.name}`}
      className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      to={appRoutes.communityDetail(community.slug)}
    >
      <Card className="h-full p-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:ring-foreground/20">
        <EventImage
          alt={`Imagen de ${community.name}`}
          className="rounded-t-xl"
          imageUrl={community.image_url}
        />
        <CardHeader className="gap-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="line-clamp-2 text-lg">
              {community.name}
            </CardTitle>
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>
          <CardDescription className="line-clamp-3 min-h-[3.75rem] pb-5">
            {community.description || 'Sin descripción registrada.'}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
