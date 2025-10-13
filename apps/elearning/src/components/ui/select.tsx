'use client'

import type * as SelectPrimitive from '@radix-ui/react-select'
import {
  Content,
  Group,
  Icon,
  Item,
  ItemIndicator,
  ItemText,
  Label,
  Portal,
  Root,
  ScrollDownButton,
  ScrollUpButton,
  type SelectGroupProps,
  type SelectItemProps,
  type SelectLabelProps,
  type SelectProps,
  type SelectScrollDownButtonProps,
  type SelectScrollUpButtonProps,
  type SelectSeparatorProps,
  type SelectValueProps,
  Separator,
  Trigger,
  Value,
  Viewport,
} from '@radix-ui/react-select'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export const Select = (props: SelectProps) => <Root data-slot="select" {...props} />

export const SelectGroup = ({ ...props }: SelectGroupProps) => <Group data-slot="select-group" {...props} />

export const SelectValue = ({ ...props }: SelectValueProps) => <Value data-slot="select-value" {...props} />

export type SelectTriggerProps = SelectPrimitive.SelectTriggerProps

export const SelectTrigger = ({ children, className, ...props }: SelectTriggerProps) => (
  <Trigger
    className={cn(
      `flex h-9 cursor-pointer items-center justify-between gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] hover:bg-accent/80 hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:hover:bg-input/50 [&>span]:line-clamp-1 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0`,
      className
    )}
    data-slot="select-trigger"
    {...props}
  >
    {children}
    <Icon asChild>
      <ChevronDownIcon className="size-4 opacity-50" />
    </Icon>
  </Trigger>
)

export type SelectContentProps = SelectPrimitive.SelectContentProps

export const SelectContent = ({ children, className, position = 'popper', ...props }: SelectContentProps) => (
  <Portal>
    <Content
      className={cn(
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=open]:animate-in',
        position === 'popper' &&
          'data-[side=left]:-translate-x-1 data-[side=top]:-translate-y-1 data-[side=right]:translate-x-1 data-[side=bottom]:translate-y-1',
        className
      )}
      data-slot="select-content"
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width) scroll-my-1'
        )}
      >
        {children}
      </Viewport>
      <SelectScrollDownButton />
    </Content>
  </Portal>
)

export const SelectLabel = ({ className, ...props }: SelectLabelProps) => (
  <Label className={cn('px-2 py-1.5 font-medium text-sm', className)} data-slot="select-label" {...props} />
)

export const SelectItem = ({
  children,
  className,
  indicator = true,
  ...props
}: SelectItemProps & {
  indicator?: React.ReactNode
}) => (
  <Item
    className={cn(
      `relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2`,
      indicator ? 'pr-8' : '[&>span]:w-full',
      className
    )}
    data-slot="select-item"
    {...props}
  >
    {indicator && (
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <ItemIndicator>
          <CheckIcon className="size-4" />
        </ItemIndicator>
      </span>
    )}
    <ItemText>{children}</ItemText>
  </Item>
)

export const SelectSeparator = ({ className, ...props }: SelectSeparatorProps) => (
  <Separator
    className={cn('-mx-1 pointer-events-none my-1 h-px bg-border', className)}
    data-slot="select-separator"
    {...props}
  />
)

export const SelectScrollUpButton = ({ className, ...props }: SelectScrollUpButtonProps) => (
  <ScrollUpButton
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    data-slot="select-scroll-up-button"
    {...props}
  >
    <ChevronUpIcon className="size-4" />
  </ScrollUpButton>
)

export const SelectScrollDownButton = ({ className, ...props }: SelectScrollDownButtonProps) => (
  <ScrollDownButton
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    data-slot="select-scroll-down-button"
    {...props}
  >
    <ChevronDownIcon className="size-4" />
  </ScrollDownButton>
)
