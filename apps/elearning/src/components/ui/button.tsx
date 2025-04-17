import { useMemo } from 'react'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface ButtonProps extends Omit<React.ComponentProps<'button'>, 'color'>, VariantProps<typeof button> {
  asChild?: boolean
  disabled?: boolean
  loading?: boolean
  loadingText?: string
}

const ButtonRoot = ({ asChild = false, className, color, disabled, hover, size, variant, ...props }: ButtonProps) => {
  const Component = useMemo(() => (asChild ? Slot : 'button'), [asChild])

  return (
    <Component
      className={cn(button({ className, color, disabled, hover, size, variant }))}
      data-slot="button"
      disabled={disabled}
      {...props}
    />
  )
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
    'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
  ],
  {
    defaultVariants: {
      color: 'default',
      hover: true,
      size: 'default',
      variant: 'default',
      disabled: false,
    },
    variants: {
      variant: {
        default: '',
        outline: 'border border-input bg-transparent',
        ghost: 'bg-transparent',
        link: '!h-auto border-none bg-transparent !p-0 font-normal',
      },
      color: {
        default: 'text-accent-foreground focus-visible:ring-accent/20 dark:focus-visible:ring-accent/40',
        primary: 'bg-primary text-primary-foreground shadow-xs focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs focus-visible:ring-secondary/20 dark:focus-visible:ring-secondary/40',
        tertiary:
          'bg-tertiary text-tertiary-foreground shadow-xs focus-visible:ring-tertiary/20 dark:focus-visible:ring-tertiary/40',
        destructive:
          'bg-destructive text-destructive-foreground shadow-xs focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        muted: 'bg-muted text-muted-foreground shadow-xs',
      },
      hover: {
        true: '',
      },
      size: {
        default: 'h-8 px-3 has-[>svg]:px-2.5',
        sm: 'h-7 px-2 text-sm has-[>svg]:px-2',
        lg: 'h-9 px-4 has-[>svg]:px-3',
        icon: 'size-9',
      },
      disabled: {
        true: 'cursor-default opacity-50',
      },
    },
    compoundVariants: [
      {
        color: 'default',
        hover: true,
        disabled: false,
        className: 'hover:bg-accent',
      },
      {
        variant: ['outline', 'ghost'],
        hover: true,
        disabled: false,
        className: 'hover:bg-accent hover:text-accent-foreground',
      },
      {
        variant: ['link'],
        hover: true,
        disabled: false,
        className: 'hover:bg-transparent hover:text-accent-foreground',
      },
      {
        color: 'primary',
        hover: true,
        disabled: false,
        className: 'hover:bg-primary-accent',
      },
      {
        color: 'secondary',
        hover: true,
        disabled: false,
        className: 'hover:bg-secondary-accent',
      },
      {
        color: 'tertiary',
        hover: true,
        disabled: false,
        className: 'hover:bg-tertiary-accent',
      },
      {
        color: 'destructive',
        hover: true,
        disabled: false,
        className: 'hover:bg-destructive',
      },
      {
        color: 'muted',
        hover: true,
        disabled: false,
        className: 'hover:bg-muted-foreground hover:text-muted',
      },
    ],
  },
)
