'use client'

import { useRef } from 'react'

import { type VariantProps, cva } from 'class-variance-authority'

import { LucideIcon } from '@/components/icons/lucide'
import { type IconName } from '@/components/icons/registry'
import { Label } from '@/components/ui/label'
import { useComposedRefs } from '@/hooks/use-composed-refs'
import { useMounted } from '@/hooks/use-mounted'
import { useShortcut } from '@/hooks/use-shortcut'
import { type Icon } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface InputProps
  extends
    Omit<React.ComponentProps<'input'>, keyof VariantProps<typeof inputVariants>>,
    VariantProps<typeof inputVariants> {
  blurOnEscape?: boolean
  defaultOpen?: boolean
  hotkey?: string
  icon?: Icon | IconName
  open?: boolean
}

export const inputVariants = cva(
  [
    'flex w-full min-w-0 rounded-md border border-border-strong bg-field transition-[color,background-color,border-color] outline-none',
    'placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-60 aria-invalid:border-destructive',
    'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
  ],
  {
    defaultVariants: {
      ring: true,
      size: 'md',
    },
    variants: {
      ring: {
        false: '',
        true: 'focus-visible:focus-ring-inset',
      },
      size: {
        xs: 'h-7 px-2 text-base md:text-xs pointer-coarse:text-base',
        sm: 'h-8 px-2.5 text-base md:text-sm pointer-coarse:text-base',
        md: 'h-9 px-3 text-base md:text-sm pointer-coarse:text-base',
        lg: 'h-11 px-3.5 text-base',
      },
      variant: {
        floating: 'peer block appearance-none bg-transparent placeholder:text-transparent',
      },
    },
  }
)

const ICON_CLASS_NAME =
  'absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground peer-focus/input:text-foreground'

export const Input = ({
  blurOnEscape,
  className,
  defaultOpen,
  disabled,
  hotkey,
  icon,
  id,
  onKeyDown,
  open,
  placeholder,
  ref,
  ring,
  size,
  variant,
  ...props
}: InputProps) => {
  const mounted = useMounted()
  const inputRef = useRef<HTMLInputElement>(null)
  const composedRef = useComposedRefs(inputRef, ref)
  const IconComponent = typeof icon === 'function' ? icon : null

  useShortcut(hotkey ? { key: hotkey } : undefined, () => inputRef.current?.focus())

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (blurOnEscape && e.key === 'Escape') inputRef.current?.blur()
    onKeyDown?.(e)
  }

  if (variant !== 'floating') {
    return (
      <input
        className={cn(inputVariants({ ring, size, variant }), className)}
        disabled={disabled}
        id={id}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={composedRef}
        {...props}
      />
    )
  }

  return (
    <div className={cn('relative', disabled && 'cursor-not-allowed')}>
      <input
        className={cn(inputVariants({ ring, size, variant }), className)}
        disabled={disabled}
        id={id}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={composedRef}
        {...props}
      />
      <Label
        className={cn(
          'absolute top-2 left-1.5 origin-left transform bg-transparent px-2 font-normal text-muted-foreground transition-[scale,top,translate] duration-180 peer-placeholder-shown:top-4.75 peer-placeholder-shown:-translate-y-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:cursor-text peer-focus:pointer-events-none peer-focus:top-2 peer-focus:-translate-y-5 peer-focus:scale-95 peer-focus:bg-background peer-focus:text-foreground peer-placeholder-shown:peer-aria-invalid:text-destructive/60 peer-focus:peer-aria-invalid:text-destructive-text peer-[:not(:placeholder-shown)]:pointer-events-none peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-5 peer-[:not(:placeholder-shown)]:scale-95 peer-[:not(:placeholder-shown)]:bg-background peer-[:not(:placeholder-shown)]:peer-aria-invalid:text-destructive-text',
          (open || (defaultOpen && !mounted)) &&
            'peer-placeholder-shown:top-2 peer-placeholder-shown:-translate-y-5 peer-placeholder-shown:scale-95 peer-placeholder-shown:bg-background peer-focus:text-foreground peer-aria-invalid:text-destructive-text'
        )}
        htmlFor={id}
      >
        {placeholder}
      </Label>
      {typeof icon === 'string' && <LucideIcon name={icon} className={ICON_CLASS_NAME} />}
      {IconComponent && <IconComponent className={ICON_CLASS_NAME} />}
    </div>
  )
}
