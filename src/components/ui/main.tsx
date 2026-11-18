import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const mainWidthVariants = cva('flex w-full flex-1 flex-col', {
  defaultVariants: {
    width: 'full',
  },
  variants: {
    width: {
      content: 'max-w-4xl',
      full: '',
      prose: 'max-w-3xl',
      wide: 'max-w-6xl',
    },
  },
})

export const Main = ({
  children,
  className,
  width = 'full',
  ...props
}: React.ComponentProps<'main'> & VariantProps<typeof mainWidthVariants>) => (
  <main
    className={cn('relative mx-auto -mt-16 flex size-full max-w-310 flex-col px-page pb-12 sm:pb-16', className)}
    data-width={width}
    {...props}
  >
    {width === 'full' ? children : <div className={mainWidthVariants({ width })}>{children}</div>}
  </main>
)
