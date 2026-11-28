'use client'

import { useLayoutEffect, useRef } from 'react'

import { type VariantProps, cva } from 'class-variance-authority'

import { useComposedRefs } from '@/hooks/use-composed-refs'
import { cn } from '@/lib/utils'

const INPUT_NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' ']

const supportsFieldSizing = () => typeof CSS !== 'undefined' && CSS.supports('field-sizing', 'content')

const adjustSize = (element: HTMLTextAreaElement) => {
  if (supportsFieldSizing()) return
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

const inlineInputVariants = cva(
  `-mx-0.5 field-sizing-content w-full min-w-0 resize-none overflow-hidden rounded-sm border border-transparent bg-transparent px-0.5 align-top transition-colors duration-150 outline-none placeholder:text-fg-placeholder hover:bg-muted/40 focus-visible:border focus-visible:bg-muted/70 disabled:pointer-events-none disabled:opacity-50`,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        default: 'text-sm',
        lg: 'text-base',
        sm: 'text-xs',
        title: 'type-title',
      },
    },
  }
)

export const InlineInput = ({
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
      adjustSize(ref.current)
    }
  }, [value])

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const empty = !e.target.value.trim()

    if (keepFilled && empty) {
      const controlled = value !== undefined && onChange
      if (controlled) {
        e.target.value = staticValueRef.current.toString()
        onChange(e)
      }
      if (!controlled && ref.current) ref.current.value = staticValueRef.current.toString()
      onBlur?.(e)
      requestAnimationFrame(() => {
        if (ref.current) {
          adjustSize(ref.current)
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
      value={value}
      {...props}
    />
  )
}
