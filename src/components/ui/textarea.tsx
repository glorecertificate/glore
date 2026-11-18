'use client'

import { useEffect, useEffectEvent, useRef } from 'react'

import { cn } from '@/lib/utils'

interface TextareaProps extends React.ComponentProps<'textarea'> {
  ring?: boolean
}

export const Textarea = ({ autoFocus, className, ring = true, ...props }: TextareaProps) => {
  const ref = useRef<HTMLTextAreaElement>(null)

  const focusTextarea = useEffectEvent(() => {
    if (!ref.current) return
    const { length } = ref.current.value
    ref.current.setSelectionRange(length, length)
  })

  useEffect(() => {
    if (!autoFocus) return
    const timeout = setTimeout(focusTextarea, 100)
    return () => clearTimeout(timeout)
  }, [autoFocus])

  return (
    <textarea
      autoFocus={autoFocus}
      className={cn(
        'flex field-sizing-content min-h-16 w-full rounded-md border border-border-strong bg-field px-3 py-2 text-base transition-[color,border-color] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm',
        ring && 'focus-visible:focus-ring-inset',
        className
      )}
      data-slot="textarea"
      ref={ref}
      {...props}
    />
  )
}
