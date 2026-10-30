import { formatEventDate } from '@/features/events/model/event-formatters'
import type { Registration } from '@/features/registrations/model/registration.schemas'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'

type AttendeeListProps = {
  attendees: Registration[]
}

export function AttendeeList({ attendees }: AttendeeListProps) {
  return (
    <>
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Apellido</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Fecha de inscripción</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendees.map((attendee) => (
                <TableRow key={attendee.id}>
                  <TableCell>{attendee.user?.first_name}</TableCell>
                  <TableCell>{attendee.user?.last_name}</TableCell>
                  <TableCell className="whitespace-normal">
                    {attendee.user?.email}
                  </TableCell>
                  <TableCell>
                    {formatEventDate(attendee.registered_at)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{attendee.status.name}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:hidden">
        {attendees.map((attendee) => (
          <Card key={attendee.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">
                  {attendee.user?.first_name} {attendee.user?.last_name}
                </p>
                <Badge variant="default">{attendee.status.name}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {attendee.user?.email}
              </p>
              <p className="text-sm text-muted-foreground">
                Inscrito el {formatEventDate(attendee.registered_at)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
