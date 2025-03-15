import { useMemo } from 'react'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ComponentProps<'button'>, VariantProps<typeof button> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const ButtonRoot = ({ asChild = false, className, size, variant, ...props }: ButtonProps) => {
  const Component = useMemo(() => (asChild ? Slot : 'button'), [asChild])
  return <Component className={cn(button({ variant, size, className }))} data-slot="button" {...props} />
}

export const Button = ({ children, disabled, loading, loadingText, ...props }: ButtonProps) => {
  const isDisabled = useMemo(() => disabled || loading, [disabled, loading])

  return (
    <ButtonRoot disabled={isDisabled} {...props}>
      {loading ? (
        <>
          <LoaderIcon className="animate-spin" />
          {loadingText && <span>{loadingText}</span>}
          {children}
        </>
      ) : (
        children
      )}
    </ButtonRoot>
  )
}

const button = cva(
  [
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none',
    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
    'disabled:pointer-events-none disabled:opacity-50',
    'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
  ],
  {
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
    variants: {
      variant: {
        default: 'bg-accent text-accent-foreground shadow-xs hover:bg-accent-foreground hover:text-accent',
        outline: 'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        primary: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary-accent',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary-accent',
        tertiary: 'bg-tertiary text-tertiary-foreground shadow-xs hover:bg-tertiary-accent',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive-foreground focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
      },
      size: {
        sm: 'h-8 rounded-md px-3 has-[>svg]:px-2.5',
        md: 'h-9 px-4 py-2 has-[>svg]:px-3',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
  },
)
