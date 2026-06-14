'use client'

import { useLayoutEffect, useRef } from 'react'

import { type VariantProps, cva } from 'class-variance-authority'

import { useComposedRefs } from '@/hooks/use-composed-refs'
import { cn } from '@/lib/utils'

const INPUT_NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' ']

const adjustSize = (
  element: HTMLTextAreaElement,
  {
    autoWidth,
    defaultValue,
    value,
  }: Pick<React.ComponentProps<'textarea'>, 'defaultValue' | 'value'> & { autoWidth?: boolean }
) => {
  element.style.height = 'auto'

  if (autoWidth) {
    element.style.width = 'auto'
    const computed = window.getComputedStyle(element)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (context) {
      context.font = computed.font
      const text = (value as string) || element.value || (typeof defaultValue === 'string' ? defaultValue : '') || ''
      const metrics = context.measureText(text)
      const paddingX = Number.parseFloat(computed.paddingLeft) + Number.parseFloat(computed.paddingRight)
      const borderX = Number.parseFloat(computed.borderLeftWidth) + Number.parseFloat(computed.borderRightWidth)
      element.style.width = `${Math.ceil(metrics.width + paddingX + borderX)}px`
    }
  }

  element.style.height = `${element.scrollHeight}px`
}

const inlineInputVariants = cva(
  `-mx-0.5 w-full min-w-0 resize-none overflow-hidden rounded border border-transparent bg-transparent px-0.5 align-top transition-colors duration-150 outline-none placeholder:text-muted-foreground/40 hover:bg-muted/40 focus-visible:border focus-visible:bg-muted/70 disabled:pointer-events-none disabled:opacity-50`,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'text-sm',
        lg: 'text-base',
        sm: 'text-xs',
      },
    },
  }
)

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
}: Omit<React.ComponentProps<'textarea'>, 'rows' | 'size'> &
  VariantProps<typeof inlineInputVariants> & {
    /**
     * When true, the input width adapts to the content.
     */
    autoWidth?: boolean
    /**
     * When true, resets the value to `defaultValue` on blur.
     * @default true
     */
    keepFilled?: boolean
  }) => {
  const ref = useRef<HTMLTextAreaElement>(null)
  const composedRefs = useComposedRefs(ref, forwardedRef)
  const staticValueRef = useRef(value ?? defaultValue ?? '')

  useLayoutEffect(() => {
    if (ref.current) {
      adjustSize(ref.current, { autoWidth, defaultValue, value })
    }
  }, [autoWidth, defaultValue, value])

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const empty = !e.target.value.trim()

    if (keepFilled && empty) {
      if (value !== undefined && onChange) {
        e.target.value = staticValueRef.current.toString()
        onChange(e)
      } else if (ref.current) {
        ref.current.value = staticValueRef.current.toString()
      }
      onBlur?.(e)
      requestAnimationFrame(() => {
        if (ref.current) {
          adjustSize(ref.current, { autoWidth, defaultValue, value })
        }
      })
      return
    }
    staticValueRef.current = e.target.value
    onBlur?.(e)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (INPUT_NAVIGATION_KEYS.includes(e.key)) e.stopPropagation()
    if (e.key === 'Enter') {
      e.preventDefault()
      ref.current?.blur()
    }
    if (e.key === 'Escape') ref.current?.blur()
    onKeyDown?.(e)
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e)
  }

  const inputStyle = autoWidth ? { width: 'auto', ...props.style } : props.style

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
      style={inputStyle}
      value={value}
      {...props}
    />
  )
}
