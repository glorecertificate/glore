import { useMemo } from 'react'

import { Slot, Slottable } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { Loader } from '@/components/ui/icons/loader'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    React.RefAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ElementType
  iconPlacement?: 'left' | 'right'
  loading?: boolean
  loadingText?: string
}

export const Button = ({
  asChild = false,
  children,
  className,
  disabled,
  effect,
  icon: Icon,
  iconPlacement,
  loading = false,
  loadingText,
  size,
  variant,
  ...props
}: ButtonProps) => {
  const Component = useMemo(() => (asChild ? Slot : 'button'), [asChild])
  const hasLeftIcon = useMemo(() => !loading && iconPlacement === 'left', [loading, iconPlacement])
  const hasRightIcon = useMemo(() => !loading && iconPlacement === 'right', [loading, iconPlacement])
  const isDisabled = useMemo(() => disabled || loading, [disabled, loading])

  return (
    <Component className={cn(buttonVariants({ variant, size, effect, className }))} disabled={isDisabled} {...props}>
      {Icon &&
        hasLeftIcon &&
        (effect === 'expandIcon' ? (
          <div
            className={`
              w-0 translate-x-[0%] pr-0 opacity-0 transition-all duration-100
              group-hover:w-4 group-hover:translate-x-100 group-hover:pr-2 group-hover:opacity-100
            `}
          >
            <Icon />
          </div>
        ) : (
          <Icon />
        ))}
      <Slottable>
        {loading ? (
          <>
            <Loader />
            {loadingText && <span>{loadingText}</span>}
            {children}
          </>
        ) : (
          children
        )}
      </Slottable>
      {Icon &&
        hasRightIcon &&
        (effect === 'expandIcon' ? (
          <div
            className={`
              w-0 translate-x-[100%] pl-0 opacity-0 transition-all duration-100
              group-hover:w-5 group-hover:translate-x-0 group-hover:pl-2 group-hover:opacity-100
            `}
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
    inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none
    focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
    disabled:pointer-events-none disabled:opacity-50
    aria-invalid:border-destructive aria-invalid:ring-destructive/20
    dark:aria-invalid:ring-destructive/40
    [&_svg]:pointer-events-none [&_svg]:shrink-0
    [&_svg:not([class*='size-'])]:size-4
  `,
  {
    defaultVariants: {
      variant: 'outline',
      size: 'md',
      effect: null,
    },
    variants: {
      variant: {
        default: 'bg-default text-default-foreground shadow-xs hover:bg-default/90',
        inverted: 'bg-inverted text-inverted-foreground shadow-xs hover:bg-inverted/80',
        destructive: `
          bg-destructive text-destructive-foreground shadow-xs
          hover:bg-destructive-accent
          focus-visible:ring-destructive/20
          dark:focus-visible:ring-destructive/40
        `,
        warning:
          'bg-warning text-warning-foreground shadow-xs hover:bg-warning-accent focus-visible:ring-warning/20 dark:focus-visible:ring-warning/40',
        success:
          'bg-success text-success-foreground shadow-xs hover:bg-success-accent focus-visible:ring-success/20 dark:focus-visible:ring-success/40',
        primary:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary-accent focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40',
        secondary: `
          bg-secondary text-secondary-foreground shadow-xs
          hover:bg-secondary-accent
          focus-visible:ring-secondary/20
          dark:focus-visible:ring-secondary/40
        `,
        tertiary:
          'bg-tertiary text-tertiary-foreground shadow-xs hover:bg-tertiary-accent focus-visible:ring-tertiary/20 dark:focus-visible:ring-tertiary/40',
        outline:
          'border border-input bg-background shadow-xs hover:bg-accent/80 hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50',
        ghost: 'hover:bg-accent/80 hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
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
        ringHover: 'transition-all duration-300 hover:ring-2 hover:ring-primary/90 hover:ring-offset-2',
        shine: `
          relative overflow-hidden transition-[background-position_0s_ease]
          before:absolute before:inset-0 before:animate-shine before:rounded-[inherit]
          before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%,transparent_100%)] before:bg-[length:250%_250%,100%_100%]
          before:bg-no-repeat
        `,
        shineHover: `
          relative overflow-hidden
          before:absolute before:inset-0 before:rounded-[inherit]
          before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%,transparent_100%)] before:bg-[length:250%_250%,100%_100%]
          before:bg-[position:200%_0,0_0] before:bg-no-repeat before:transition-[background-position_0s_ease] before:duration-1000
          hover:before:bg-[position:-100%_0,0_0]
        `,
        gooeyRight: `
          relative z-0 overflow-hidden from-white/40 transition-all duration-500
          before:absolute before:inset-0 before:-z-10 before:translate-x-[150%] before:translate-y-[150%] before:scale-[2.5] before:rounded-[100%]
          before:bg-gradient-to-r before:transition-transform before:duration-1000
          hover:before:translate-x-[0%] hover:before:translate-y-[0%]
        `,
        gooeyLeft: `
          relative z-0 overflow-hidden from-white/40 transition-all duration-500
          after:absolute after:inset-0 after:-z-10 after:translate-x-[-150%] after:translate-y-[150%] after:scale-[2.5] after:rounded-[100%]
          after:bg-gradient-to-l after:transition-transform after:duration-1000
          hover:after:translate-x-[0%] hover:after:translate-y-[0%]
        `,
        underline: `
          relative !no-underline
          after:absolute after:bottom-2 after:h-[1px] after:w-2/3 after:origin-bottom-left after:scale-x-100 after:bg-primary after:transition-transform
          after:duration-300 after:ease-in-out
          hover:after:origin-bottom-right hover:after:scale-x-0
        `,
        hoverUnderline: `
          relative !no-underline
          after:absolute after:bottom-0 after:h-[1px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-current/80 after:transition-transform
          after:duration-200 after:ease-in-out
          hover:after:origin-bottom-left hover:after:scale-x-100
        `,
        gradientSlideShow: `
          animate-gradient-flow bg-[linear-gradient(-45deg,var(--gradient-lime),var(--gradient-ocean),var(--gradient-wine),var(--gradient-rust))]
          bg-[size:400%]
        `,
      },
    },
  },
)
