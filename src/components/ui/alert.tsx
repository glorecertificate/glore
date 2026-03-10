import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export const Alert = ({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) => (
  <div className={cn(alertVariants({ variant }), className)} data-slot="alert" role="alert" {...props} />
)

export const AlertTitle = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn('col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', className)}
    data-slot="alert-title"
    {...props}
  />
)

export const AlertDescription = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn(
      'col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed',
      className
    )}
    data-slot="alert-description"
    {...props}
  />
)

export const AlertCallout = ({
  description,
  icon: Icon,
  title,
  ...props
}: React.ComponentProps<typeof Alert> & {
  description?: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title?: string
}) => (
  <Alert {...props}>
    {Icon && <Icon />}
    {title && <AlertTitle>{title}</AlertTitle>}
    {description && <AlertDescription>{description}</AlertDescription>}
  </Alert>
)

const alertVariants = cva(
  `relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-2 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current`,
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'bg-card/20 text-card-foreground',
        destructive:
          'bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 [&>svg]:text-current',
        info: `border-blue-200 bg-blue-50 text-blue-800 *:data-[slot=alert-description]:text-blue-800/80 dark:border-blue-600 dark:bg-blue-900/50 dark:text-blue-300 dark:*:data-[slot=alert-description]:text-blue-400/95 [&>svg]:text-blue-800 dark:[&>svg]:text-blue-300`,
        warning: `border-warning/25 bg-warning/5 [&>svg]:text-warning/80`,
        success: `border-green-200 bg-green-50 text-green-800 *:data-[slot=alert-description]:text-green-800/80 dark:border-green-600 dark:bg-green-900/50 dark:text-green-300 dark:*:data-[slot=alert-description]:text-green-400/95 [&>svg]:text-green-800 dark:[&>svg]:text-green-300`,
        neutral: `border-gray-200 bg-gray-50 text-gray-800 *:data-[slot=alert-description]:text-gray-800/80 dark:border-gray-600 dark:bg-gray-900/50 dark:text-gray-300 dark:*:data-[slot=alert-description]:text-gray-400/95 [&>svg]:text-gray-800 dark:[&>svg]:text-gray-300`,
      },
    },
  }
)
