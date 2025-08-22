import { cva, type VariantProps } from 'class-variance-authority'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface InputProps extends Omit<React.ComponentProps<'input'>, 'size'>, VariantProps<typeof inputVariants> {}

export const Input = ({ className, id, placeholder, size, variant, ...props }: InputProps) => {
  if (variant !== 'floating')
    return <input className={cn(inputVariants({ variant, size }), className)} placeholder={placeholder} {...props} />

  return (
    <div className="relative">
      <input className={cn(inputVariants({ variant, size }), className)} id={id} placeholder={placeholder} {...props} />
      <Label
        className={`
          absolute start-2 top-2 z-10 origin-[0] -translate-y-4 scale-85 transform bg-background px-2 text-muted-foreground duration-200
          peer-placeholder-shown:top-[19px] peer-placeholder-shown:-translate-y-2 peer-placeholder-shown:scale-100
          peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-85 peer-focus:px-2
        `}
        htmlFor={id}
      >
        {placeholder}
      </Label>
    </div>
  )
}

export const inputVariants = cva(
  `
    flex w-full min-w-0 rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] outline-none
    file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground
    placeholder:text-muted-foreground
    focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30
    disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50
    aria-invalid:border-destructive aria-invalid:ring-destructive/20
    dark:bg-input/30 dark:aria-invalid:ring-destructive/40
  `,
  {
    variants: {
      variant: {
        brand: 'focus-visible:border-brand focus-visible:ring-brand/50',
        floating: 'dark:bg-transparent peer block appearance-none placeholder:text-transparent',
      },
      size: {
        sm: 'h-8 px-2.5 py-0.5 text-xs placeholder:text-xs',
        md: 'h-9 px-3 py-1 text-sm placeholder:text-sm',
        lg: 'h-10 px-3.5 py-1.5 text-base placeholder:text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)
