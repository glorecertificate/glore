'use client'

import { Command as CommandPrimitive } from 'cmdk'
import { SearchIcon } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface CommandProps extends React.ComponentProps<typeof CommandPrimitive> {}
export interface CommandDialogProps extends React.ComponentProps<typeof Dialog> {
  title?: string
  description?: string
  className?: string
  showClose?: boolean
}
export interface CommandInputProps extends React.ComponentProps<typeof CommandPrimitive.Input> {}
export interface CommandListProps extends React.ComponentProps<typeof CommandPrimitive.List> {}
export interface CommandEmptyProps extends React.ComponentProps<typeof CommandPrimitive.Empty> {}
export interface CommandGroupProps extends React.ComponentProps<typeof CommandPrimitive.Group> {}
export interface CommandItemProps extends React.ComponentProps<typeof CommandPrimitive.Item> {}
export interface CommandShortcutProps extends React.ComponentProps<'span'> {}

export const Command = ({ className, ...props }: CommandProps) => (
  <CommandPrimitive
    className={cn('flex size-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground', className)}
    data-slot="command"
    {...props}
  />
)

export const CommandDialog = ({
  children,
  className,
  description = 'Search for a command to run...',
  showClose = true,
  title = 'Command Palette',
  ...props
}: CommandDialogProps) => (
  <Dialog {...props}>
    <DialogHeader className="sr-only">
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    <DialogContent className={cn('overflow-hidden p-0', className)} showClose={showClose}>
      <Command
        className={
          '**:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:size-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:size-5'
        }
      >
        {children}
      </Command>
    </DialogContent>
  </Dialog>
)

export const CommandInput = ({ className, ...props }: CommandInputProps) => (
  <div className="flex h-9 items-center gap-2 border-b px-3" data-slot="command-input-wrapper">
    <SearchIcon className="size-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      className={cn(
        'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      data-slot="command-input"
      {...props}
    />
  </div>
)

export const CommandList = ({ className, ...props }: CommandListProps) => (
  <CommandPrimitive.List
    className={cn('max-h-[300px] scroll-py-1 overflow-y-auto overflow-x-hidden', className)}
    data-slot="command-list"
    {...props}
  />
)

export const CommandEmpty = ({ ...props }: CommandEmptyProps) => (
  <CommandPrimitive.Empty className="py-6 text-center text-sm" data-slot="command-empty" {...props} />
)

export const CommandGroup = ({ className, ...props }: CommandGroupProps) => (
  <CommandPrimitive.Group
    className={cn(
      'overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:text-xs',
      className
    )}
    data-slot="command-group"
    {...props}
  />
)

export const CommandSeparator = ({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) => (
  <CommandPrimitive.Separator
    className={cn('-mx-1 h-px bg-border', className)}
    data-slot="command-separator"
    {...props}
  />
)

export const CommandItem = ({ className, ...props }: CommandItemProps) => (
  <CommandPrimitive.Item
    className={cn(
      `relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0`,
      className
    )}
    data-slot="command-item"
    {...props}
  />
)

export const CommandShortcut = ({ className, ...props }: CommandShortcutProps) => (
  <span
    className={cn('ml-auto text-muted-foreground text-xs tracking-widest', className)}
    data-slot="command-shortcut"
    {...props}
  />
)
