'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { useComposedRefs } from '@/hooks/use-composed-refs'
import { cn } from '@/lib/utils'

const NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' ']

export interface InlineInputProps
  extends Omit<React.ComponentProps<'textarea'>, 'rows' | 'size'>,
    VariantProps<typeof inlineInputVariants> {
  /**
   * When true, the input width adapts to the content.
   */
  autoWidth?: boolean
  /**
   * When true, resets the value to `defaultValue` on blur.
   *
   * @default true
   */
  keepFilled?: boolean
}

export const InlineInput = ({
  autoWidth,
  className,
  defaultValue,
  keepFilled = true,
  onBlur,
  onKeyDown,
  onChange,
  ref: forwardedRef,
  size,
  value,
  ...props
}: InlineInputProps) => {
  const ref = useRef<HTMLTextAreaElement>(null)
  const composedRefs = useComposedRefs(ref, forwardedRef)
  const [staticValue, setStaticValue] = useState(value ?? defaultValue ?? '')

  const adjustSize = useCallback(() => {
    if (!ref.current) return

    ref.current.style.height = 'auto'

    if (autoWidth) {
      ref.current.style.width = 'auto'
      const computed = window.getComputedStyle(ref.current)
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      if (context) {
        context.font = computed.font
        const text =
          (value as string) || ref.current.value || (typeof defaultValue === 'string' ? defaultValue : '') || ''
        const metrics = context.measureText(text)
        const paddingX = Number.parseFloat(computed.paddingLeft) + Number.parseFloat(computed.paddingRight)
        const borderX = Number.parseFloat(computed.borderLeftWidth) + Number.parseFloat(computed.borderRightWidth)
        ref.current.style.width = `${Math.ceil(metrics.width + paddingX + borderX)}px`
      }
    }

    ref.current.style.height = `${ref.current.scrollHeight}px`
  }, [autoWidth, defaultValue, value])

  useLayoutEffect(adjustSize, [adjustSize])

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      const empty = !e.target.value.trim()

      if (keepFilled && empty) {
        if (value !== undefined && onChange) {
          e.target.value = staticValue.toString()
          onChange(e)
        } else if (ref.current) {
          ref.current.value = staticValue.toString()
        }

        onBlur?.(e)
        requestAnimationFrame(() => adjustSize())
        return
      }
      setStaticValue(e.target.value)
      onBlur?.(e)
    },
    [keepFilled, onBlur, onChange, staticValue, value, adjustSize]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (NAVIGATION_KEYS.includes(e.key)) {
        e.stopPropagation()
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        ref.current?.blur()
      }
      if (e.key === 'Escape') {
        ref.current?.blur()
      }
      onKeyDown?.(e)
    },
    [onKeyDown]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e)
    },
    [onChange]
  )

  return (
    <textarea
      autoComplete="off"
      className={cn(inlineInputVariants({ size }), className)}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      ref={composedRefs}
      rows={1}
      spellCheck={false}
      style={autoWidth ? { width: 'auto', ...props.style } : props.style}
      value={value}
      {...props}
    />
  )
}

const inlineInputVariants = cva(
  `
    w-full min-w-0 resize-none overflow-hidden bg-transparent
    outline-none rounded -mx-0.5 px-0.5 align-top
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
