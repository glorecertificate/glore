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
  overlap = false,
  width = 'full',
  ...props
}: React.ComponentProps<'main'> & VariantProps<typeof mainWidthVariants> & { overlap?: boolean }) => (
  <main
    className={cn(
      'relative mx-auto flex size-full max-w-296 flex-col px-page pb-12 sm:pb-16',
      overlap ? '-mt-16' : 'pt-6',
      className
    )}
    data-overlap={overlap || undefined}
    data-width={width}
    {...props}
  >
    {width === 'full' ? children : <div className={mainWidthVariants({ width })}>{children}</div>}
  </main>
)
