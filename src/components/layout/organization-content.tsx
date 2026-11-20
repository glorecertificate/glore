'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useEffectEvent } from 'react'

import { useSession } from '@/components/providers/session'
import { APP_ROOT, ORGANIZATION_PARAM } from '@/lib/constants'
import { cn } from '@/lib/utils'

export const OrganizationContent = ({ children }: React.PropsWithChildren) => {
  const { organization, setOrganization, switching, user } = useSession()
  const { refresh } = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const param = pathname === APP_ROOT ? searchParams.get(ORGANIZATION_PARAM) : null

  const settle = useEffectEvent((id: number) => {
    if (id !== organization?.id && user.organizations.some(org => org.id === id)) setOrganization(id)
    window.history.replaceState(null, '', APP_ROOT)
    refresh()
  })

  useEffect(() => {
    if (param === null) return
    settle(Number(param))
  }, [param])

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
