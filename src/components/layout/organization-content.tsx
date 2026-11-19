'use client'

import { useSession } from '@/components/providers/session'
import { cn } from '@/lib/utils'

export const OrganizationContent = ({ children }: React.PropsWithChildren) => {
  const { switching } = useSession()

  return (
    <div
      aria-busy={switching}
      className={cn(
        'flex min-w-0 flex-1 flex-col transition-opacity duration-150 ease-out motion-reduce:transition-none',
        switching && 'opacity-60 delay-75'
      )}
      inert={switching}
    >
      {children}
    </div>
  )
}
