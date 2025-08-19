import { cn } from '@udecode/cn'

export const AppMain = ({ className, ...props }: React.ComponentProps<'main'>) => (
  <main
    className={cn('mx-auto flex size-full min-h-[calc(100vh-72px)] max-w-[1400px] flex-col px-8', className)}
    {...props}
  />
)
