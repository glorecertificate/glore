'use client'

import { useContext } from 'react'

import { NavigationContext } from '@/components/providers/navigation-provider'
import { usePathname } from '@/hooks/use-pathname'
import { type Route } from '@/lib/navigation'

/**
 * Returns information about the current navigation status.
 */
export const useNavigation = () => {
  const pathname = usePathname()
  const context = useContext(NavigationContext)
  if (!context) throw new Error('useNavigation must be used within a NavigationProvider')
  const routes = context.routes

  const route = routes.find(({ path }) => {
    if (path === pathname) return true

    const pathParts = path.split('/')
    const pathnameParts = pathname.split('/')
    if (pathParts.length !== pathnameParts.length) return false

    const dynamicParts = pathParts.filter(part => part.startsWith(':'))
    if (!dynamicParts.length) return false

    return pathParts.every((part, index) => {
      if (part.startsWith(':')) return true
      return part === pathnameParts[index]
    })
  }) as Route

  return { pathname, routes, route }
}
