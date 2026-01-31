import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

export const Textarea = ({ autoFocus, className, ...props }: React.ComponentProps<'textarea'>) => {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus && ref.current) {
      const length = ref.current.value.length
      ref.current.setSelectionRange(length, length)
    }
  }, [autoFocus])

  return (
    <textarea
      autoFocus={autoFocus}
      className={cn(
        'field-sizing-content flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40',
        className
      )}
      data-slot="textarea"
      ref={ref}
      {...props}
    />
  )
}
