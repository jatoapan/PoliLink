import { Clock3 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { cn } from '@/shared/utils/cn'

const minuteOptions = ['00', '15', '30', '45']
const hourOptions = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, '0'),
)

type TimePickerProps = {
  'aria-describedby'?: string | undefined
  'aria-invalid'?: boolean | undefined
  disabled?: boolean
  id: string
  minTime?: string | undefined
  onChange: (value: string) => void
  value: string
}

function isBeforeTime(value: string, minimum: string | undefined) {
  return minimum !== undefined && value < minimum
}

export function TimePicker({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  disabled = false,
  id,
  minTime,
  onChange,
  value,
}: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const [hour = '', minute = ''] = value.split(':')
  const [draftHour, setDraftHour] = useState(hour)
  const [draftMinute, setDraftMinute] = useState(minute)

  useEffect(() => {
    setDraftHour(hour)
    setDraftMinute(minute)
  }, [hour, minute])

  const updateTime = (nextHour: string, nextMinute: string) => {
    setDraftHour(nextHour)
    setDraftMinute(nextMinute)

    if (nextHour && nextMinute) {
      onChange(`${nextHour}:${nextMinute}`)
      setOpen(false)
    }
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
          )}
          disabled={disabled}
          id={id}
          type="button"
          variant="outline"
        >
          {value || 'Selecciona una hora'}
          <Clock3 aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`${id}-hour`}>Hora</Label>
            <Select
              onValueChange={(nextHour) => updateTime(nextHour, draftMinute)}
              value={draftHour}
            >
              <SelectTrigger aria-label="Hora" id={`${id}-hour`}>
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent>
                {hourOptions.map((option) => (
                  <SelectItem
                    disabled={isBeforeTime(`${option}:59`, minTime)}
                    key={option}
                    value={option}
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-minute`}>Minutos</Label>
            <Select
              onValueChange={(nextMinute) => updateTime(draftHour, nextMinute)}
              value={draftMinute}
            >
              <SelectTrigger aria-label="Minutos" id={`${id}-minute`}>
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {minuteOptions.map((option) => (
                  <SelectItem
                    disabled={isBeforeTime(
                      `${draftHour || '00'}:${option}`,
                      minTime,
                    )}
                    key={option}
                    value={option}
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Usa la hora local de ESPOL (UTC-5).
        </p>
      </PopoverContent>
    </Popover>
  )
}
