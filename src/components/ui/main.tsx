import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const mainWidthVariants = cva('mx-auto flex w-full flex-1 flex-col', {
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
    className={cn(
      'mx-auto flex size-full min-h-[calc(100vh-72px)] max-w-420 flex-col px-page pt-4 pb-12 sm:pt-6 sm:pb-16',
      className
    )}
    data-width={width}
    {...props}
  >
    {width === 'full' ? children : <div className={mainWidthVariants({ width })}>{children}</div>}
  </main>
)
