'use client'

import { useCallback, useRef, useState } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { useComposedRefs } from '@/hooks/use-composed-refs'
import { cn } from '@/lib/utils'

export interface InlineInputProps
  extends Omit<React.ComponentProps<'input'>, 'size'>,
    VariantProps<typeof inlineInputVariants> {
  /**
   * When true, resets the value to `defaultValue` on blur.
   * @default true
   */
  keepFilled?: boolean
}

export const InlineInput = ({
  className,
  defaultValue,
  keepFilled = true,
  onBlur,
  onKeyDown,
  ref: forwardedRef,
  size,
  value,
  ...props
}: InlineInputProps) => {
  const ref = useRef<HTMLInputElement>(null)
  const composedRefs = useComposedRefs(ref, forwardedRef)

  const [staticValue, setStaticValue] = useState(value ?? defaultValue ?? '')

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (keepFilled && !e.target.value.trim()) {
        if (ref.current) {
          ref.current.value = staticValue.toString()
        }
        onBlur?.(e)
        return
      }
      setStaticValue(e.target.value)
      onBlur?.(e)
    },
    [keepFilled, onBlur, staticValue]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        ref.current?.blur()
      }
      onKeyDown?.(e)
    },
    [onKeyDown]
  )

  return (
    <input
      autoComplete="off"
      className={cn(inlineInputVariants({ size }), className)}
      defaultValue={value ?? defaultValue}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      ref={composedRefs}
      spellCheck={false}
      {...props}
    />
  )
}

const inlineInputVariants = cva(
  `
    inline-flex min-w-0 bg-transparent outline-none field-sizing-content
    rounded px-1 -mx-0.5
    transition-colors duration-150 border border-transparent
    hover:bg-muted/40
    focus-visible:bg-muted/70 focus-visible:border
    placeholder:text-muted-foreground/40
    disabled:pointer-events-none disabled:opacity-50
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        sm: 'text-xs',
        default: 'text-sm',
        lg: 'text-base',
      },
    },
  }
)
