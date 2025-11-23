'use client'

import * as SelectPrimitive from '@radix-ui/react-select'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export const Select = (props: React.ComponentProps<typeof SelectPrimitive.Select>) => (
  <SelectPrimitive.Root data-slot="select" {...props} />
)

export const SelectGroup = (props: React.ComponentProps<typeof SelectPrimitive.SelectGroup>) => (
  <SelectPrimitive.Group data-slot="select-group" {...props} />
)

export const SelectValue = (props: React.ComponentProps<typeof SelectPrimitive.SelectValue>) => (
  <SelectPrimitive.Value data-slot="select-value" {...props} />
)

export type SelectTriggerProps = SelectPrimitive.SelectTriggerProps

export const SelectTrigger = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.SelectTrigger>) => (
  <SelectPrimitive.Trigger
    className={cn(
      'flex h-9 not-disabled:cursor-pointer items-center justify-between gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-all',
      'not-disabled:hover:bg-accent/50 not-disabled:focus-visible:border-ring not-disabled:focus-visible:ring-[3px] not-disabled:focus-visible:ring-ring/50',
      "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive not-disabled:aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 not-disabled:dark:hover:bg-input/50 [&>span]:line-clamp-1 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
      className
    )}
    data-slot="select-trigger"
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDownIcon className="size-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
)

export type SelectContentProps = React.ComponentProps<typeof SelectPrimitive.SelectContent>

export const SelectContent = ({ children, className, position = 'popper', ...props }: SelectContentProps) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      className={cn(
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 relative z-51 max-h-96 min-w-32 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=open]:animate-in',
        position === 'popper' &&
          'data-[side=left]:-translate-x-1 data-[side=top]:-translate-y-1 data-[side=right]:translate-x-1 data-[side=bottom]:translate-y-1',
        className
      )}
      data-slot="select-content"
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width) scroll-my-1'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
)

export const SelectLabel = ({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.SelectLabel>) => (
  <SelectPrimitive.Label
    className={cn('px-2 py-1.5 font-medium text-sm', className)}
    data-slot="select-label"
    {...props}
  />
)

export interface SelectItemProps extends React.ComponentProps<typeof SelectPrimitive.Item> {
  indicator?: React.ReactNode
}

export const SelectItem = ({ children, className, indicator = true, ...props }: SelectItemProps) => (
  <SelectPrimitive.Item
    className={cn(
      `relative flex w-full not-disabled:cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2`,
      indicator ? 'pr-8' : '[&>span]:w-full',
      className
    )}
    data-slot="select-item"
    {...props}
  >
    {indicator && (
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
    )}
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
)

export const SelectSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.SelectSeparator>) => (
  <SelectPrimitive.Separator
    className={cn('-mx-1 pointer-events-none my-1 h-px bg-border', className)}
    data-slot="select-separator"
    {...props}
  />
)

export const SelectScrollUpButton = ({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.SelectScrollUpButton>) => (
  <SelectPrimitive.ScrollUpButton
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    data-slot="select-scroll-up-button"
    {...props}
  >
    <ChevronUpIcon className="size-4" />
  </SelectPrimitive.ScrollUpButton>
)

export const SelectScrollDownButton = ({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.SelectScrollDownButton>) => (
  <SelectPrimitive.ScrollDownButton
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    data-slot="select-scroll-down-button"
    {...props}
  >
    <ChevronDownIcon className="size-4" />
  </SelectPrimitive.ScrollDownButton>
)
