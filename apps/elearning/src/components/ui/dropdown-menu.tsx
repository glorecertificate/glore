'use client'

import {
  Root,
  Portal,
  Trigger,
  Content,
  SubContent,
  SubTrigger,
  Group,
  Item,
  CheckboxItem,
  RadioGroup,
  RadioItem,
  Label,
  Separator,
  ItemIndicator,
  Sub,
} from '@radix-ui/react-dropdown-menu'
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export type DropdownMenuProps = React.ComponentProps<typeof Root>

export const DropdownMenu = (props: DropdownMenuProps) => <Root data-slot="dropdown-menu" {...props} />

export const DropdownMenuPortal = (props: React.ComponentProps<typeof Portal>) => (
  <Portal data-slot="dropdown-menu-portal" {...props} />
)

export const DropdownMenuTrigger = (props: React.ComponentProps<typeof Trigger>) => (
  <Trigger data-slot="dropdown-menu-trigger" {...props} />
)

export const DropdownMenuContent = ({ className, sideOffset = 4, ...props }: React.ComponentProps<typeof Content>) => (
  <Portal>
    <Content
      className={cn(
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=open]:animate-in',
        className
      )}
      data-slot="dropdown-menu-content"
      sideOffset={sideOffset}
      {...props}
    />
  </Portal>
)

export const DropdownMenuGroup = (props: React.ComponentProps<typeof Group>) => (
  <Group data-slot="dropdown-menu-group" {...props} />
)

export const DropdownMenuItemIndicator = (props: React.ComponentProps<typeof ItemIndicator>) => (
  <ItemIndicator data-slot="dropdown-menu-item-indicator" {...props} />
)

export interface DropdownMenuItemProps extends React.ComponentProps<typeof Item> {
  inset?: boolean
  variant?: 'default' | 'destructive'
}

export const DropdownMenuItem = ({ className, inset, variant = 'default', ...props }: DropdownMenuItemProps) => (
  <Item
    className={cn(
      `relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[inset]:pl-8 data-[variant=destructive]:text-destructive data-[disabled]:opacity-50 data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 data-[variant=destructive]:*:[svg]:text-destructive!`,
      className
    )}
    data-inset={inset}
    data-slot="dropdown-menu-item"
    data-variant={variant}
    {...props}
  />
)

export const DropdownMenuCheckboxItem = ({
  checked,
  children,
  className,
  ...props
}: React.ComponentProps<typeof CheckboxItem>) => (
  <CheckboxItem
    checked={checked}
    className={cn(
      `relative flex cursor-default select-none items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm decoration-0 outline-hidden focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0`,
      className
    )}
    data-slot="dropdown-menu-checkbox-item"
    {...props}
  >
    <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
      <ItemIndicator>
        <CheckIcon className="size-4" />
      </ItemIndicator>
    </span>
    {children}
  </CheckboxItem>
)

export const DropdownMenuRadioGroup = (props: React.ComponentProps<typeof RadioGroup>) => (
  <RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
)

export const DropdownMenuRadioItem = ({ children, className, ...props }: React.ComponentProps<typeof RadioItem>) => (
  <RadioItem
    className={cn(
      `relative flex cursor-default select-none items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0`,
      className
    )}
    data-slot="dropdown-menu-radio-item"
    {...props}
  >
    <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
      <ItemIndicator>
        <CircleIcon className="size-2 fill-current" />
      </ItemIndicator>
    </span>
    {children}
  </RadioItem>
)

export const DropdownMenuLabel = ({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof Label> & {
  inset?: boolean
}) => (
  <Label
    className={cn('px-2 py-1.5 font-medium text-sm data-[inset]:pl-8', className)}
    data-inset={inset}
    data-slot="dropdown-menu-label"
    {...props}
  />
)

export const DropdownMenuSeparator = ({ className, ...props }: React.ComponentProps<typeof Separator>) => (
  <Separator className={cn('-mx-1 my-1 h-px bg-border', className)} data-slot="dropdown-menu-separator" {...props} />
)

export const DropdownMenuShortcut = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    className={cn('ml-auto text-muted-foreground text-xs tracking-widest', className)}
    data-slot="dropdown-menu-shortcut"
    {...props}
  />
)

export const DropdownMenuSub = (props: React.ComponentProps<typeof Sub>) => (
  <Sub data-slot="dropdown-menu-sub" {...props} />
)

export const DropdownMenuSubTrigger = ({
  children,
  className,
  inset,
  ...props
}: React.ComponentProps<typeof SubTrigger> & {
  inset?: boolean
}) => (
  <SubTrigger
    className={cn(
      'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[inset]:pl-8 data-[state=open]:text-accent-foreground',
      className
    )}
    data-inset={inset}
    data-slot="dropdown-menu-sub-trigger"
    {...props}
  >
    {children}
    <ChevronRightIcon className="ml-auto size-4" />
  </SubTrigger>
)

export const DropdownMenuSubContent = ({ className, ...props }: React.ComponentProps<typeof SubContent>) => (
  <SubContent
    className={cn(
      'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in',
      className
    )}
    data-slot="dropdown-menu-sub-content"
    {...props}
  />
)
