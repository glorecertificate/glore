'use client'

import { Slot, Slottable } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'

import { Spinner } from '@/components/ui/spinner'
import { type Icon } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends
    Omit<React.ComponentProps<'button'>, keyof VariantProps<typeof buttonVariants>>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  disabledTitle?: string
  icon?: Icon
  /** @default 'left' */
  iconPlacement?: 'left' | 'right'
  loading?: boolean
  loadingText?: string
  loadingTitle?: string
  spinner?: string
}

export const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:focus-visible:ring-0',
  ],
  {
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      effect: null,
    },
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground not-disabled:hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground not-disabled:hover:bg-secondary/80',
        destructive:
          'bg-destructive text-destructive-foreground not-disabled:hover:bg-destructive-accent not-disabled:focus-visible:ring-destructive/20 not-disabled:dark:focus-visible:ring-destructive/40',
        warning:
          'bg-warning text-warning-foreground not-disabled:hover:bg-warning-accent not-disabled:focus-visible:ring-warning/20 not-disabled:dark:focus-visible:ring-warning/40',
        success:
          'bg-success text-success-foreground not-disabled:hover:bg-success-accent not-disabled:focus-visible:ring-success/20 not-disabled:dark:focus-visible:ring-success/40',
        brand:
          'bg-brand text-brand-foreground not-disabled:hover:bg-brand-accent not-disabled:focus-visible:ring-brand/20 not-disabled:dark:focus-visible:ring-brand/40',
        'brand-secondary':
          'bg-brand-secondary text-brand-secondary-foreground not-disabled:hover:bg-brand-secondary-accent not-disabled:focus-visible:ring-brand-secondary/20 not-disabled:dark:focus-visible:ring-brand-secondary/40',
        'brand-tertiary':
          'bg-brand-tertiary text-brand-tertiary-foreground not-disabled:hover:bg-brand-tertiary-accent not-disabled:focus-visible:ring-brand-tertiary/20 not-disabled:dark:focus-visible:ring-brand-tertiary/40',
        outline:
          'border border-input bg-background text-foreground not-disabled:hover:bg-accent/60 dark:bg-input/30 not-disabled:dark:hover:bg-input/50',
        ghost: 'text-foreground not-disabled:hover:bg-accent/80 dark:not-disabled:hover:bg-accent/50',
        link: 'hover:underline hover:underline-offset-2',
        transparent: 'bg-transparent text-current',
      },
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        md: 'h-9 px-4 py-2 has-[>svg]:px-3',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        text: 'h-auto p-0',
      },
      effect: {
        expandIcon: 'group relative gap-0',
        ringHover: 'transition-all duration-300 hover:ring-2 hover:ring-brand-secondary/90 hover:ring-offset-2',
        gooeyRight: `relative z-0 overflow-hidden from-white/40 transition-all duration-500 before:absolute before:inset-0 before:-z-10 before:translate-x-[150%] before:translate-y-[150%] before:scale-[2.5] before:rounded-[100%] before:bg-linear-to-r before:transition-transform before:duration-1000 hover:before:translate-x-[0%] hover:before:translate-y-[0%]`,
        gooeyLeft: `relative z-0 overflow-hidden from-white/40 transition-all duration-500 after:absolute after:inset-0 after:-z-10 after:translate-x-[-150%] after:translate-y-[150%] after:scale-[2.5] after:rounded-[100%] after:bg-linear-to-l after:transition-transform after:duration-1000 hover:after:translate-x-[0%] hover:after:translate-y-[0%]`,
        underline: `relative no-underline! after:absolute after:bottom-2 after:h-px after:w-2/3 after:origin-bottom-left after:scale-x-100 after:bg-brand-secondary after:transition-transform after:duration-300 after:ease-in-out hover:after:origin-bottom-right hover:after:scale-x-0`,
        hoverUnderline: `relative no-underline! after:absolute after:bottom-0 after:h-px after:w-[calc(100%-4px)] after:origin-bottom-right after:scale-x-0 after:bg-current/60 after:transition-transform after:duration-150 after:ease-in-out hover:after:origin-bottom-left hover:after:scale-x-100`,
      },
    },
    compoundVariants: [
      {
        variant: [
          'primary',
          'secondary',
          'destructive',
          'warning',
          'success',
          'brand',
          'brand-secondary',
          'brand-tertiary',
        ],
        className: 'not-disabled:shadow-xs not-disabled:[:active,[data-pressed]]:shadow-none',
      },
    ],
  }
)

export const Button = ({
  asChild = false,
  children,
  className,
  disabled,
  disabledTitle,
  effect,
  icon: Icon,
  iconPlacement = 'left',
  loading = false,
  loadingText,
  loadingTitle,
  size,
  spinner,
  title,
  type,
  variant,
  ...props
}: ButtonProps) => {
  const Component = asChild ? Slot : 'button'
  const label = loading ? loadingTitle : disabled ? disabledTitle : title

  return (
    <Component
      className={cn(
        buttonVariants({ effect, size, variant }),
        loading && 'cursor-wait disabled:cursor-wait',
        type === 'submit' ? 'transition-colors' : 'transition-all',
        className
      )}
      disabled={disabled || loading}
      title={label}
      type={type}
      {...props}
    >
      {Icon &&
        iconPlacement === 'left' &&
        !loading &&
        (effect === 'expandIcon' ? (
          <div className="w-0 overflow-hidden pr-0 opacity-0 transition-all duration-200 group-hover:w-5 group-hover:pr-2 group-hover:opacity-100">
            <Icon />
          </div>
        ) : (
          <Icon />
        ))}
      <Slottable>
        {loading ? (
          <>
            <Spinner className={spinner} />
            {loadingText ? <span>{loadingText}</span> : children}
          </>
        ) : (
          children
        )}
      </Slottable>
      {Icon &&
        iconPlacement === 'right' &&
        !loading &&
        (effect === 'expandIcon' ? (
          <div className="w-0 overflow-hidden pl-0 opacity-0 transition-all duration-200 group-hover:w-5 group-hover:pl-2 group-hover:opacity-100">
            <Icon />
          </div>
        ) : (
          <Icon />
        ))}
    </Component>
  )
}
