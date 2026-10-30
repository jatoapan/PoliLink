'use client'

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from 'lucide-react'
import {
  type ChevronProps,
  DayPicker,
  type DayPickerProps,
} from 'react-day-picker'

import { buttonVariants } from '@/shared/ui/button'
import { cn } from '@/shared/utils/cn'

function CalendarChevron({
  orientation = 'right',
  size = 16,
  className,
}: ChevronProps) {
  const Icon =
    orientation === 'left'
      ? ChevronLeftIcon
      : orientation === 'up'
        ? ChevronUpIcon
        : orientation === 'down'
          ? ChevronDownIcon
          : ChevronRightIcon

  return (
    <Icon aria-hidden="true" className={cn('size-4', className)} size={size} />
  )
}

function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = true,
  ...props
}: DayPickerProps) {
  return (
    <DayPicker
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col gap-4 sm:flex-row',
        month: 'space-y-4',
        month_caption: 'relative flex items-center justify-center pt-1',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'absolute left-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'absolute right-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday:
          'w-8 rounded-md text-[0.8rem] font-normal text-muted-foreground',
        week: 'mt-2 flex w-full',
        day: 'relative size-8 p-0 text-center text-sm',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-8 p-0 font-normal aria-selected:opacity-100',
        ),
        selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        today: 'bg-accent text-accent-foreground',
        outside: 'text-muted-foreground opacity-50',
        disabled: 'text-muted-foreground opacity-50',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{ Chevron: CalendarChevron, ...components }}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  )
}

export { Calendar }
