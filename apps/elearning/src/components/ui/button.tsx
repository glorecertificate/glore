'use client'

import { useCallback, useMemo } from 'react'

import { Slot, Slottable } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { Spinner } from '@/components/icons/spinner'
import { type Icon } from '@/components/icons/types'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'>,
    React.RefAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  disabledCursor?: boolean
  disabledTitle?: string
  icon?: Icon
  iconPlacement?: 'left' | 'right'
  loading?: boolean
  loadingText?: string
  loadingTitle?: string
}

export const Button = ({
  asChild = false,
  children,
  className,
  disabled,
  disabledCursor = false,
  disabledTitle,
  effect,
  icon: Icon,
  iconPlacement,
  loading = false,
  loadingText,
  loadingTitle,
  onClick,
  size,
  title,
  variant,
  ...props
}: ButtonProps) => {
  const Component = useMemo(() => (asChild ? Slot : 'button'), [asChild])
  const hasLeftIcon = useMemo(() => !loading && iconPlacement === 'left', [loading, iconPlacement])
  const hasRightIcon = useMemo(() => !loading && iconPlacement === 'right', [loading, iconPlacement])
  const isDisabled = useMemo(() => disabled || loading, [disabled, loading])
  const buttonTitle = useMemo(
    () => (loading ? loadingTitle : disabled ? disabledTitle : title),
    [loading, loadingTitle, disabled, disabledTitle, title]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) return
      return onClick?.(e)
    },
    [isDisabled, onClick]
  )

  return (
    <Component
      className={cn(
        buttonVariants({ variant, disabled: isDisabled, size, effect }),
        disabledCursor && isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
        loading && 'cursor-wait',
        className
      )}
      disabled={isDisabled}
      onClick={handleClick}
      title={buttonTitle}
      {...props}
    >
      {Icon &&
        hasLeftIcon &&
        (effect === 'expandIcon' ? (
          <div
            className={
              'w-0 translate-x-[0%] pr-0 opacity-0 transition-all duration-100 group-hover:w-4 group-hover:translate-x-100 group-hover:pr-2 group-hover:opacity-100'
            }
          >
            <Icon />
          </div>
        ) : (
          <Icon />
        ))}
      <Slottable>
        {loading ? (
          <>
            <Spinner />
            {loadingText ? <span>{loadingText}</span> : children}
          </>
        ) : (
          children
        )}
      </Slottable>
      {Icon &&
        hasRightIcon &&
        (effect === 'expandIcon' ? (
          <div
            className={
              'w-0 translate-x-full pl-0 opacity-0 transition-all duration-100 group-hover:w-5 group-hover:translate-x-0 group-hover:pl-2 group-hover:opacity-100'
            }
          >
            <Icon />
          </div>
        ) : (
          <Icon />
        ))}
    </Component>
  )
}

export const buttonVariants = cva(
  `
    inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none
    focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
    aria-invalid:border-destructive aria-invalid:ring-destructive/20
    dark:aria-invalid:ring-destructive/40
    [&_svg]:pointer-events-none [&_svg]:shrink-0
    [&_svg:not([class*='size-'])]:size-4
  `,
  {
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      effect: null,
    },
    variants: {
      disabled: {
        true: 'opacity-50',
      },
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-xs',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs',
        destructive: 'bg-destructive text-destructive-foreground shadow-xs',
        warning: 'bg-warning text-warning-foreground shadow-xs',
        success: 'bg-success text-success-foreground shadow-xs',
        brand: 'bg-brand text-brand-foreground shadow-xs',
        'brand-secondary': 'bg-brand-secondary text-brand-secondary-foreground shadow-xs',
        'brand-tertiary': 'bg-brand-tertiary text-brand-tertiary-foreground shadow-xs',
        outline: 'border border-input bg-background shadow-xs dark:bg-input/30',
        ghost: '',
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
        shine: `
          relative overflow-hidden transition-[background-position_0s_ease]
          before:absolute before:inset-0 before:animate-shine before:rounded-[inherit]
          before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%,transparent_100%)] before:bg-length-[250%_250%,100%_100%]
          before:bg-no-repeat
        `,
        shineHover: `
          relative overflow-hidden
          before:absolute before:inset-0 before:rounded-[inherit]
          before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%,transparent_100%)] before:bg-length-[250%_250%,100%_100%]
          before:bg-position-[200%_0,0_0] before:bg-no-repeat before:transition-[background-position_0s_ease] before:duration-1000
          hover:before:bg-position-[-100%_0,0_0]
        `,
        gooeyRight: `
          relative z-0 overflow-hidden from-white/40 transition-all duration-500
          before:absolute before:inset-0 before:-z-10 before:translate-x-[150%] before:translate-y-[150%] before:scale-[2.5] before:rounded-[100%]
          before:bg-linear-to-r before:transition-transform before:duration-1000
          hover:before:translate-x-[0%] hover:before:translate-y-[0%]
        `,
        gooeyLeft: `
          relative z-0 overflow-hidden from-white/40 transition-all duration-500
          after:absolute after:inset-0 after:-z-10 after:translate-x-[-150%] after:translate-y-[150%] after:scale-[2.5] after:rounded-[100%]
          after:bg-linear-to-l after:transition-transform after:duration-1000
          hover:after:translate-x-[0%] hover:after:translate-y-[0%]
        `,
        underline: `
          relative no-underline!
          after:absolute after:bottom-2 after:h-px after:w-2/3 after:origin-bottom-left after:scale-x-100 after:bg-brand-secondary after:transition-transform
          after:duration-300 after:ease-in-out
          hover:after:origin-bottom-right hover:after:scale-x-0
        `,
        hoverUnderline: `
          relative no-underline!
          after:absolute after:bottom-0 after:h-px after:w-[calc(100%-4px)] after:origin-bottom-right after:scale-x-0 after:bg-current/60
          after:transition-transform after:duration-150 after:ease-in-out
          hover:after:origin-bottom-left hover:after:scale-x-100
        `,
        gradientSlideShow: `
          animate-gradient-flow bg-[linear-gradient(-45deg,var(--gradient-lime),var(--gradient-ocean),var(--gradient-wine),var(--gradient-rust))]
          bg-size-[400%]
        `,
      },
    },
    compoundVariants: [
      {
        variant: 'primary',
        disabled: false,
        className: 'hover:bg-primary/90',
      },
      {
        variant: 'secondary',
        disabled: false,
        className: 'hover:bg-secondary/80',
      },
      {
        variant: 'destructive',
        disabled: false,
        className:
          'hover:bg-destructive-accent focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
      },
      {
        variant: 'warning',
        disabled: false,
        className: 'hover:bg-warning-accent focus-visible:ring-warning/20 dark:focus-visible:ring-warning/40',
      },
      {
        variant: 'success',
        disabled: false,
        className: 'hover:bg-success-accent focus-visible:ring-success/20 dark:focus-visible:ring-success/40',
      },
      {
        variant: 'brand',
        disabled: false,
        className: 'hover:bg-brand-accent focus-visible:ring-brand/20 dark:focus-visible:ring-brand/40',
      },
      {
        variant: 'brand-secondary',
        disabled: false,
        className:
          'hover:bg-brand-secondary-accent focus-visible:ring-brand-secondary/20 dark:focus-visible:ring-brand-secondary/40',
      },
      {
        variant: 'brand-tertiary',
        disabled: false,
        className:
          'hover:bg-brand-tertiary-accent focus-visible:ring-brand-tertiary/20 dark:focus-visible:ring-brand-tertiary/40',
      },
      {
        variant: 'outline',
        disabled: false,
        className: 'hover:bg-accent/80 hover:text-accent-foreground dark:hover:bg-input/50',
      },
      {
        variant: 'ghost',
        disabled: false,
        className: 'hover:bg-accent/80 hover:text-accent-foreground dark:hover:bg-accent/50',
      },
    ],
  }
)
