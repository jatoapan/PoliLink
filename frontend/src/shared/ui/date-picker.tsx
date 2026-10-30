import { format, startOfToday } from 'date-fns'
import { es as dateFnsEs } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { es as dayPickerEs } from 'react-day-picker/locale'

import { Button } from '@/shared/ui/button'
import { Calendar } from '@/shared/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { cn } from '@/shared/utils/cn'

type DatePickerProps = {
  'aria-describedby'?: string | undefined
  'aria-invalid'?: boolean | undefined
  disabled?: boolean
  id: string
  onChange: (value: string) => void
  value: string
}

function parseDateValue(value: string): Date | undefined {
  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) return undefined

  return new Date(year, month - 1, day)
}

export function DatePicker({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  disabled = false,
  id,
  onChange,
  value,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseDateValue(value)

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          className={cn(
            'w-full justify-between font-normal',
            !selectedDate && 'text-muted-foreground',
          )}
          disabled={disabled}
          id={id}
          type="button"
          variant="outline"
        >
          {selectedDate
            ? format(selectedDate, 'PPP', { locale: dateFnsEs })
            : 'Selecciona una fecha'}
          <CalendarDays aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          autoFocus
          defaultMonth={selectedDate ?? startOfToday()}
          disabled={{ before: startOfToday() }}
          locale={dayPickerEs}
          mode="single"
          onSelect={(date) => {
            if (date) {
              onChange(format(date, 'yyyy-MM-dd'))
              setOpen(false)
            }
          }}
          selected={selectedDate}
        />
      </PopoverContent>
    </Popover>
  )
}
