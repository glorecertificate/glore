import { useEffect, useRef } from 'react'

import { type VariantProps, cva } from 'class-variance-authority'

import { Label } from '@/components/ui/label'
import { useComposedRefs } from '@/hooks/use-composed-refs'
import { useMounted } from '@/hooks/use-mounted'
import { type Icon } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface InputProps
  extends
    Omit<React.ComponentProps<'input'>, keyof VariantProps<typeof inputVariants>>,
    VariantProps<typeof inputVariants> {
  blurOnEscape?: boolean
  defaultOpen?: boolean
  hotkey?: string
  icon?: Icon
  open?: boolean
}

export const inputVariants = cva(
  [
    'flex w-full min-w-0 rounded-md border border-input bg-transparent transition-[color,box-shadow] outline-none',
    'placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/20',
    'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
    'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
    'dark:bg-input/30 dark:aria-invalid:ring-destructive/40',
  ],
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        sm: 'h-8 px-2.5 py-0.5 text-xs placeholder:text-xs',
        default: 'h-9.5 px-3 py-1 text-sm placeholder:text-sm',
        lg: 'h-10 px-3.5 py-1.5 text-base placeholder:text-base',
      },
      variant: {
        brand: 'focus-visible:border-brand focus-visible:ring-brand/50',
        floating: 'peer block appearance-none placeholder:text-transparent dark:bg-transparent',
      },
    },
  }
)

export const Input = ({
  blurOnEscape,
  className,
  defaultOpen,
  disabled,
  hotkey,
  icon: Icon,
  id,
  onKeyDown,
  open,
  placeholder,
  ref,
  size,
  variant,
  ...props
}: InputProps) => {
  const mounted = useMounted()
  const inputRef = useRef<HTMLInputElement>(null)
  const composedRef = useComposedRefs(inputRef, ref)

  useEffect(() => {
    if (!hotkey) return
    const handleHotkey = (e: KeyboardEvent) => {
      const active = document.activeElement
      const isEditable =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      if (e.key === hotkey && !isEditable) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleHotkey)
    return () => document.removeEventListener('keydown', handleHotkey)
  }, [hotkey])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (blurOnEscape && e.key === 'Escape') inputRef.current?.blur()
    onKeyDown?.(e)
  }

  if (variant !== 'floating') {
    return (
      <input
        className={cn(inputVariants({ size, variant }), className)}
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
        className={cn(inputVariants({ size, variant }), className)}
        disabled={disabled}
        id={id}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={composedRef}
        {...props}
      />
      <Label
        className={cn(
          'absolute top-2 left-1.5 origin-left transform bg-transparent px-2 font-normal text-muted-foreground transition-[scale,top,translate] duration-180 peer-placeholder-shown:top-4.75 peer-placeholder-shown:-translate-y-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:cursor-text peer-focus:pointer-events-none peer-focus:top-2 peer-focus:-translate-y-5 peer-focus:scale-95 peer-focus:bg-background peer-focus:text-foreground peer-placeholder-shown:peer-aria-invalid:text-destructive/60 peer-focus:peer-aria-invalid:text-destructive peer-[:not(:placeholder-shown)]:pointer-events-none peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-5 peer-[:not(:placeholder-shown)]:scale-95 peer-[:not(:placeholder-shown)]:bg-background peer-[:not(:placeholder-shown)]:peer-aria-invalid:text-destructive',
          (open || (defaultOpen && !mounted)) &&
            'peer-placeholder-shown:top-2 peer-placeholder-shown:-translate-y-5 peer-placeholder-shown:scale-95 peer-placeholder-shown:bg-background peer-focus:text-foreground peer-aria-invalid:text-destructive'
        )}
        htmlFor={id}
      >
        {placeholder}
      </Label>
      {Icon && (
        <Icon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground peer-focus/input:text-foreground" />
      )}
    </div>
  )
}
