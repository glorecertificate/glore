import { cva, type VariantProps } from 'class-variance-authority'

import { Label } from '@repo/ui/components/label'
import { useMounted } from '@repo/ui/hooks/use-mounted'
import { cn } from '@repo/ui/utils'

export interface InputProps extends Omit<React.ComponentProps<'input'>, 'size'>, VariantProps<typeof inputVariants> {
  defaultOpen?: boolean
  open?: boolean
}

export const Input = ({
  className,
  defaultOpen,
  disabled,
  id,
  open,
  placeholder,
  size,
  variant,
  ...props
}: InputProps) => {
  const mounted = useMounted()

  if (variant !== 'floating')
    return (
      <input
        className={cn(inputVariants({ variant, size }), className)}
        disabled={disabled}
        placeholder={placeholder}
        {...props}
      />
    )

  return (
    <div className={cn('relative', disabled && 'cursor-not-allowed')}>
      <input
        className={cn(inputVariants({ variant, size }), className)}
        disabled={disabled}
        id={id}
        placeholder={placeholder}
        {...props}
      />
      <Label
        className={cn(
          `
            absolute top-2 left-1.5 origin-[0] transform bg-transparent px-2 font-normal text-muted-foreground
            transition-[scale,top,translate] duration-[180ms]
            peer-placeholder-shown:top-[18.5px] peer-placeholder-shown:-translate-y-2 peer-placeholder-shown:scale-100
            peer-placeholder-shown:cursor-text
            peer-focus:pointer-events-none peer-focus:top-2 peer-focus:-translate-y-5 peer-focus:scale-95 peer-focus:bg-background
            peer-focus:text-foreground
            peer-placeholder-shown:peer-aria-invalid:text-destructive/60
            peer-focus:peer-aria-invalid:text-destructive
            peer-[:not(:placeholder-shown)]:pointer-events-none peer-[:not(:placeholder-shown)]:top-2
            peer-[:not(:placeholder-shown)]:-translate-y-5 peer-[:not(:placeholder-shown)]:scale-95
            peer-[:not(:placeholder-shown)]:bg-background peer-[:not(:placeholder-shown)]:peer-aria-invalid:text-destructive
          `,
          (open || (defaultOpen && !mounted)) &&
            'peer-aria-invalid:text-destructive peer-placeholder-shown:top-2 peer-placeholder-shown:-translate-y-5 peer-placeholder-shown:scale-95 peer-placeholder-shown:bg-background peer-focus:text-foreground',
        )}
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
    disabled:pointer-events-none disabled:opacity-60
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
