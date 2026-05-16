import { type VariantProps, cva } from 'class-variance-authority'

import { type IconProps } from '@/lib/types'
import { cn } from '@/lib/utils'

const spinnerVariants = cva('animate-spin', {
  defaultVariants: {
    size: 'default',
    speed: 'default',
    variant: 'default',
  },
  variants: {
    size: {
      default: '',
      lg: 'size-5',
      md: 'size-4',
      sm: 'size-3.5',
      xl: 'size-6',
      xs: 'size-3',
    },
    speed: {
      default: 'duration-950',
      fast: 'duration-700',
      faster: 'duration-800',
      slow: 'duration-1100',
      slower: 'duration-1000',
    },
    variant: {
      colored: '',
      default: '',
    },
  },
})

export const Spinner = ({
  className,
  size,
  speed,
  variant,
  ...props
}: IconProps<VariantProps<typeof spinnerVariants>>) => (
  <svg
    className={cn(spinnerVariants({ size, speed, variant }), className)}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path className={cn(variant === 'colored' && 'text-brand-secondary')} d="M12 2v4" />
    <path className={cn(variant === 'colored' && 'text-brand')} d="m16.2 7.8 2.9-2.9" />
    <path className={cn(variant === 'colored' && 'text-brand-tertiary')} d="M18 12h4" />
    <path className={cn(variant === 'colored' && 'text-brand-secondary')} d="m16.2 16.2 2.9 2.9" />
    <path className={cn(variant === 'colored' && 'text-brand')} d="M12 18v4" />
    <path className={cn(variant === 'colored' && 'text-brand-tertiary')} d="m4.9 19.1 2.9-2.9" />
    <path className={cn(variant === 'colored' && 'text-brand-secondary')} d="M2 12h4" />
    <path className={cn(variant === 'colored' && 'text-brand')} d="m4.9 4.9 2.9 2.9" />
  </svg>
)
