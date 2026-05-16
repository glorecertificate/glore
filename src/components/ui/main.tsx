import { cn } from '@/lib/utils'

export const Main = ({ children, className, ...props }: React.ComponentProps<'main'>) => (
  <main className={cn('mx-auto flex size-full min-h-[calc(100vh-72px)] max-w-420 flex-col px-8', className)} {...props}>
    {children}
  </main>
)
