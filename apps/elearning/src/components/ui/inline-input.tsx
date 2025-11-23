import { useRef } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export interface InlineInputProps
  extends Omit<React.ComponentProps<'input'>, 'size'>,
    VariantProps<typeof inlineInputVariants> {}

export const InlineInput = ({ className, onKeyDown, size, ...props }: InlineInputProps) => {
  const ref = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' && e.key !== 'Escape') return
    e.preventDefault()
    ref.current?.blur()
    onKeyDown?.(e)
  }

  return (
    <input className={cn(inlineInputVariants({ size }), className)} onKeyDown={handleKeyDown} ref={ref} {...props} />
  )
}

export const inlineInputVariants = cva(
  `
    flex w-full min-w-0 bg-transparent transition-[color,box-shadow] outline-none transition-discrete
    decoration-muted-foreground decoration-dotted underline-offset-3 hover:underline focus:underline
    placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-60
  `,
  {
    defaultVariants: {
      size: 'default',
    },
    variants: {
      size: {
        sm: 'text-xs placeholder:text-xs',
        default: 'text-sm placeholder:text-sm',
        lg: 'text-base placeholder:text-base',
      },
    },
  }
)
