'use client'

import { Slot, Slottable } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'

import { LucideIcon } from '@/components/icons/lucide'
import { type IconName } from '@/components/icons/registry'
import { Spinner } from '@/components/ui/spinner'
import { type Icon } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends
    Omit<React.ComponentProps<'button'>, keyof VariantProps<typeof buttonVariants>>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  disabledTitle?: string
  icon?: Icon | IconName
  /** @default 'left' */
  iconPlacement?: 'left' | 'right'
  loading?: boolean
  loadingText?: string
  loadingTitle?: string
  spinner?: string
}

export const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,scale,filter] duration-100 ease-out outline-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    'focus-visible:focus-ring aria-invalid:border-destructive',
    'active:not-disabled:scale-98 motion-reduce:active:not-disabled:scale-100',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
  ],
  {
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      effect: null,
    },
    variants: {
      variant: {
        primary:
          'bg-gradient-action text-fg-on-dark shadow-glow hover:not-disabled:brightness-110 active:not-disabled:brightness-95',
        secondary: 'bg-secondary text-secondary-foreground hover:not-disabled:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:not-disabled:bg-destructive-accent',
        warning: 'bg-warning text-warning-foreground hover:not-disabled:bg-warning-accent',
        success: 'bg-success text-success-foreground hover:not-disabled:bg-success-accent',
        brand:
          'bg-gradient-action text-fg-on-dark shadow-glow hover:not-disabled:brightness-110 active:not-disabled:brightness-95',
        'brand-secondary':
          'bg-brand-secondary text-brand-secondary-foreground hover:not-disabled:bg-brand-secondary-accent',
        'brand-tertiary':
          'bg-brand-tertiary text-brand-tertiary-foreground hover:not-disabled:bg-brand-tertiary-accent',
        band: 'bg-band-action font-semibold text-band-action-foreground shadow-glow-green hover:not-disabled:bg-band-action-hover',
        'band-secondary':
          'border border-band-border bg-band-scrim text-band-foreground hover:not-disabled:bg-band-scrim/60',
        outline: 'border border-border bg-field text-foreground hover:not-disabled:bg-accent/60',
        ghost: 'text-foreground hover:not-disabled:bg-accent/80 dark:hover:not-disabled:bg-accent/50',
        link: 'hover:underline hover:underline-offset-2',
        transparent: 'bg-transparent text-current',
      },
      size: {
        '2xs': "h-6 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-7 gap-1.5 px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5",
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
        md: 'h-9 px-4 has-[>svg]:px-3',
        lg: 'h-11 px-5 text-base has-[>svg]:px-4',
        'icon-2xs': "size-6 [&_svg:not([class*='size-'])]:size-3.5",
        'icon-xs': "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        'icon-sm': 'size-8',
        icon: 'size-9',
        'icon-lg': 'size-11',
        text: 'h-auto p-0',
      },
      effect: {
        expandIcon: 'group relative gap-0',
        gooeyLeft: `relative z-0 overflow-hidden from-white/40 transition-all duration-500 after:absolute after:inset-0 after:-z-10 after:translate-x-[-150%] after:translate-y-[150%] after:scale-[2.5] after:rounded-[100%] after:bg-linear-to-l after:transition-transform after:duration-1000 hover:after:translate-[0%]`,
      },
    },
    compoundVariants: [
      {
        variant: ['secondary', 'destructive', 'warning', 'success', 'brand-secondary', 'brand-tertiary'],
        className:
          'bg-linear-to-b from-white/12 to-transparent not-disabled:shadow-xs not-disabled:inset-shadow-2xs not-disabled:inset-shadow-white/20 not-disabled:[:active,[data-pressed]]:shadow-none',
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
  icon,
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
  const IconComponent = typeof icon === 'function' ? icon : null
  const iconNode = typeof icon === 'string' ? <LucideIcon name={icon} /> : IconComponent && <IconComponent />

  return (
    <Component
      className={cn(
        buttonVariants({ effect, size, variant }),
        loading && 'cursor-wait disabled:cursor-wait',
        className
      )}
      disabled={disabled || loading}
      title={label}
      type={type}
      {...props}
    >
      {icon &&
        iconPlacement === 'left' &&
        !loading &&
        (effect === 'expandIcon' ? (
          <div className="w-0 overflow-hidden pr-0 opacity-0 transition-[width,padding,opacity] duration-200 group-hover:w-5 group-hover:pr-2 group-hover:opacity-100">
            {iconNode}
          </div>
        ) : (
          iconNode
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
      {icon &&
        iconPlacement === 'right' &&
        !loading &&
        (effect === 'expandIcon' ? (
          <div className="w-0 overflow-hidden pl-0 opacity-0 transition-[width,padding,opacity] duration-200 group-hover:w-5 group-hover:pl-2 group-hover:opacity-100">
            {iconNode}
          </div>
        ) : (
          iconNode
        ))}
    </Component>
  )
}
