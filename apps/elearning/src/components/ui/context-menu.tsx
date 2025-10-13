'use client'

import {
  CheckboxItem,
  Content,
  Group,
  Item,
  ItemIndicator,
  Label,
  Portal,
  RadioGroup,
  RadioItem,
  Root,
  Separator,
  Sub,
  SubContent,
  SubTrigger,
  Trigger,
} from '@radix-ui/react-context-menu'
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export const ContextMenu = ({ ...props }: React.ComponentProps<typeof Root>) => (
  <Root data-slot="context-menu" {...props} />
)

export const ContextMenuTrigger = ({ ...props }: React.ComponentProps<typeof Trigger>) => (
  <Trigger data-slot="context-menu-trigger" {...props} />
)

export const ContextMenuGroup = ({ ...props }: React.ComponentProps<typeof Group>) => (
  <Group data-slot="context-menu-group" {...props} />
)

export const ContextMenuPortal = ({ ...props }: React.ComponentProps<typeof Portal>) => (
  <Portal data-slot="context-menu-portal" {...props} />
)

export const ContextMenuSub = ({ ...props }: React.ComponentProps<typeof Sub>) => (
  <Sub data-slot="context-menu-sub" {...props} />
)

export const ContextMenuRadioGroup = ({ ...props }: React.ComponentProps<typeof RadioGroup>) => (
  <RadioGroup data-slot="context-menu-radio-group" {...props} />
)

export const ContextMenuSubTrigger = ({
  children,
  className,
  inset,
  ...props
}: React.ComponentProps<typeof SubTrigger> & {
  inset?: boolean
}) => (
  <SubTrigger
    className={cn(
      `flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-inset:pl-8 data-[state=open]:text-accent-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0`,
      className
    )}
    data-inset={inset}
    data-slot="context-menu-sub-trigger"
    {...props}
  >
    {children}
    <ChevronRightIcon className="ml-auto" />
  </SubTrigger>
)

export const ContextMenuSubContent = ({ className, ...props }: React.ComponentProps<typeof SubContent>) => (
  <SubContent
    className={cn(
      'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 z-50 min-w-32 origin-(--radix-context-menu-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in',
      className
    )}
    data-slot="context-menu-sub-content"
    {...props}
  />
)

export const ContextMenuContent = ({ className, ...props }: React.ComponentProps<typeof Content>) => (
  <Portal>
    <Content
      className={cn(
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 z-50 max-h-(--radix-context-menu-content-available-height) min-w-32 origin-(--radix-context-menu-content-transform-origin) overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=open]:animate-in',
        className
      )}
      data-slot="context-menu-content"
      {...props}
    />
  </Portal>
)

export const ContextMenuItem = ({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof Item> & {
  inset?: boolean
  variant?: 'default' | 'destructive'
}) => (
  <Item
    className={cn(
      `relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-inset:pl-8 data-[variant=destructive]:text-destructive data-disabled:opacity-50 data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 data-[variant=destructive]:*:[svg]:text-destructive!`,
      className
    )}
    data-inset={inset}
    data-slot="context-menu-item"
    data-variant={variant}
    {...props}
  />
)

export const ContextMenuCheckboxItem = ({
  checked,
  children,
  className,
  ...props
}: React.ComponentProps<typeof CheckboxItem>) => (
  <CheckboxItem
    checked={checked}
    className={cn(
      `relative flex cursor-default select-none items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0`,
      className
    )}
    data-slot="context-menu-checkbox-item"
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

export const ContextMenuRadioItem = ({ children, className, ...props }: React.ComponentProps<typeof RadioItem>) => (
  <RadioItem
    className={cn(
      `relative flex cursor-default select-none items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0`,
      className
    )}
    data-slot="context-menu-radio-item"
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

export const ContextMenuLabel = ({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof Label> & {
  inset?: boolean
}) => (
  <Label
    className={cn('px-2 py-1.5 font-medium text-foreground text-sm data-inset:pl-8', className)}
    data-inset={inset}
    data-slot="context-menu-label"
    {...props}
  />
)

export const ContextMenuSeparator = ({ className, ...props }: React.ComponentProps<typeof Separator>) => (
  <Separator className={cn('-mx-1 my-1 h-px bg-border', className)} data-slot="context-menu-separator" {...props} />
)

export const ContextMenuShortcut = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    className={cn('ml-auto text-muted-foreground text-xs tracking-widest', className)}
    data-slot="context-menu-shortcut"
    {...props}
  />
)
