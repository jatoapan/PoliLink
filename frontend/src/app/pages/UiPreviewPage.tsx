import { ArrowRight, CalendarDays, CheckCircle2, Info } from 'lucide-react'

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/ui/alert'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { Textarea } from '@/shared/ui/textarea'

export function UiPreviewPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="max-w-3xl space-y-4">
          <Badge variant="secondary">PoliLink design system</Badge>
          <h1 className="font-heading text-4xl leading-[1.05] font-semibold tracking-[-0.04em] sm:text-6xl">
            Warm, clear, and ready for ESPOL communities.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            A visual checkpoint for the shared primitives before we compose
            complete application screens.
          </p>
        </header>

        <section aria-labelledby="actions-title" className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle id="actions-title">Actions and status</CardTitle>
              <CardDescription>
                Primary actions stay confident while secondary actions remain
                quiet.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button>
                Explore events
                <ArrowRight />
              </Button>
              <Button variant="outline">Create an event</Button>
              <Button variant="ghost">Cancel</Button>
              <Badge>
                <CheckCircle2 />
                Available
              </Badge>
              <Badge variant="outline">Draft</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Surfaces</CardTitle>
              <CardDescription>No heavy shadows; depth comes from tone and borders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="font-medium">Cream surface</p>
                <p className="text-sm text-muted-foreground">#f7f4ed foundation</p>
              </div>
              <div className="rounded-lg border border-border bg-muted p-4">
                <p className="font-medium">Subtle tint</p>
                <p className="text-sm text-muted-foreground">Opacity-driven neutral</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="form-title">
          <Card>
            <CardHeader>
              <CardTitle id="form-title">Form states</CardTitle>
              <CardDescription>
                Labels, descriptions, focus, and validation states for event
                workflows.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="preview-title">Event title</FieldLabel>
                <Input id="preview-title" placeholder="Community workshop" />
                <FieldDescription>Use a short, descriptive title.</FieldDescription>
              </Field>
              <Field data-invalid="true">
                <FieldLabel htmlFor="preview-capacity">Capacity</FieldLabel>
                <Input id="preview-capacity" aria-invalid placeholder="0" />
                <FieldError errors={[{ message: 'Enter a capacity greater than zero.' }]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="preview-category">Category</FieldLabel>
                <Select defaultValue="workshop">
                  <SelectTrigger id="preview-category">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="talk">Talk</SelectItem>
                    <SelectItem value="social">Social activity</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="preview-description">Description</FieldLabel>
                <Textarea id="preview-description" placeholder="Tell students what to expect." />
              </Field>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="outline">Save draft</Button>
              <Button>Publish event</Button>
            </CardFooter>
          </Card>
        </section>

        <section aria-labelledby="feedback-title" className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle id="feedback-title">Feedback and overlays</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info />
                <AlertTitle>Registration open</AlertTitle>
                <AlertDescription>
                  There are still places available for this event.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertTitle>Example error</AlertTitle>
                <AlertDescription>
                  This state is reserved for actionable failures.
                </AlertDescription>
              </Alert>
              <div className="flex flex-wrap gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Open dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel registration?</DialogTitle>
                      <DialogDescription>
                        Your place will be released for another student.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Keep registration</Button>
                      </DialogClose>
                      <Button variant="destructive">Cancel registration</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost">Open mobile sheet</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>Responsive navigation and filter surface.</SheetDescription>
                    </SheetHeader>
                    <SheetFooter>
                      <Button>Apply filters</Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loading state</CardTitle>
              <CardDescription>Skeletons reserve space while data is loading.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="table-title">
          <Card>
            <CardHeader>
              <CardTitle id="table-title">Event list surface</CardTitle>
              <CardDescription>
                The table primitive is ready for organizer and registration data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Community</TableHead>
                    <TableHead>Availability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Intro to robotics</TableCell>
                    <TableCell>ESPOL Robotics</TableCell>
                    <TableCell>18 places</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Design critique</TableCell>
                    <TableCell>Creative Lab</TableCell>
                    <TableCell>Full</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="justify-between gap-3">
              <p className="text-sm text-muted-foreground">Two sample records</p>
              <Button variant="outline">
                <CalendarDays />
                View catalog
              </Button>
            </CardFooter>
          </Card>
        </section>
      </div>
    </main>
  )
}
