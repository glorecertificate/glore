'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { useSession } from '@/components/providers/session'
import { APP_ROOT, ORGANIZATION_PARAM } from '@/lib/constants'
import { cn } from '@/lib/utils'

export const OrganizationContent = ({ children }: React.PropsWithChildren) => {
  const { switching } = useSession()
  const { refresh } = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const switched = pathname === APP_ROOT && searchParams.has(ORGANIZATION_PARAM)

  useEffect(() => {
    if (!switched) return
    window.history.replaceState(null, '', APP_ROOT)
    refresh()
  }, [refresh, switched])

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
