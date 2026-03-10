'use client'

import { useCallback } from 'react'

import { type VariantProps, cva } from 'class-variance-authority'

import { Button } from '@/components/ui/button'
import { Input, type InputProps } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export const InputGroup = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn(
      'group/input-group relative flex w-full items-center rounded-md border border-input shadow-xs transition-[color,box-shadow] outline-none dark:bg-input/30',
      'h-9 min-w-0 has-[>textarea]:h-auto',
      'has-[>[data-align=inline-start]]:[&>input]:pl-2',
      'has-[>[data-align=inline-end]]:[&>input]:pr-2',
      'has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3',
      'has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3',
      'has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-[3px] has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50',
      'has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-destructive/20 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40',
      className
    )}
    data-slot="input-group"
    role="group"
    {...props}
  />
)

export const InputGroupAddon = ({
  align = 'inline-start',
  className,
  onClick,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputGroupAddonVariants>) => {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest('button')) {
        return
      }
      event.currentTarget.parentElement?.querySelector('input')?.focus()
      onClick?.(event)
    },
    [onClick]
  )

  return (
    <div
      className={cn(inputGroupAddonVariants({ align }), className)}
      data-align={align}
      data-slot="input-group-addon"
      onClick={handleClick}
      role="group"
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",
  {
    defaultVariants: {
      align: 'inline-start',
    },
    variants: {
      align: {
        'inline-start': 'order-first pl-3 has-[>button]:ml-[-0.45rem] has-[>kbd]:ml-[-0.35rem]',
        'inline-end': 'order-last pr-3 has-[>button]:mr-[-0.45rem] has-[>kbd]:mr-[-0.35rem]',
        'block-start':
          'order-first w-full justify-start px-3 pt-3 group-has-[>input]/input-group:pt-2.5 [.border-b]:pb-3',
        'block-end': 'order-last w-full justify-start px-3 pb-3 group-has-[>input]/input-group:pb-2.5 [.border-t]:pt-3',
      },
    },
  }
)

export const InputGroupButton = ({
  className,
  type = 'button',
  variant = 'ghost',
  size = 'xs',
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'size'> & VariantProps<typeof inputGroupButtonVariants>) => (
  <Button
    className={cn(inputGroupButtonVariants({ size }), className)}
    data-size={size}
    type={type}
    variant={variant}
    {...props}
  />
)

const inputGroupButtonVariants = cva('flex items-center gap-2 text-sm shadow-none', {
  defaultVariants: {
    size: 'xs',
  },
  variants: {
    size: {
      xs: "h-6 gap-1 rounded-[calc(var(--radius)-5px)] px-2 has-[>svg]:px-2 [&>svg:not([class*='size-'])]:size-3.5",
      sm: 'h-8 gap-1.5 rounded-md px-2.5 has-[>svg]:px-2.5',
      'icon-xs': 'size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0',
      'icon-sm': 'size-8 p-0 has-[>svg]:p-0',
    },
  },
})

export const InputGroupText = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    className={cn(
      "flex items-center gap-2 text-sm text-muted-foreground hover:cursor-default [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
      className
    )}
    {...props}
  />
)

export const InputGroupInput = ({ className, ...props }: InputProps) => (
  <Input
    className={cn(
      'flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent',
      className
    )}
    data-slot="input-group-control"
    {...props}
  />
)

export const InputGroupTextarea = ({ className, ...props }: React.ComponentProps<typeof Textarea>) => (
  <Textarea
    className={cn(
      'flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 dark:bg-transparent',
      className
    )}
    data-slot="input-group-control"
    {...props}
  />
)
