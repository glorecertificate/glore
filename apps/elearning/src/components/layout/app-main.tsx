import { cn } from '@udecode/cn'

export const AppMain = ({ className, ...props }: React.ComponentProps<'main'>) => (
  <main
    className={cn('mx-auto flex h-full min-h-[calc(100vh-72px)] w-full max-w-7xl flex-col px-8', className)}
    {...props}
  />
)
