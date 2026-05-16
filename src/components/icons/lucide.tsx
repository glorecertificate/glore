import { Suspense, lazy } from 'react'

import { type IconName, type IconProps } from '@/lib/types'
import { cn } from '@/lib/utils'

const iconCache = new Map<string, ReturnType<typeof lazy>>()

const getIconComponent = (name: IconName) => {
  const cached = iconCache.get(name)
  if (cached) return cached
  const component = lazy(async () => {
    const { dynamicIconImports } = await import('lucide-react/dynamic')
    const importFn = dynamicIconImports[name]
    if (!importFn) return { default: () => null } as Awaited<ReturnType<typeof importFn>>
    return importFn()
  })
  iconCache.set(name, component)
  return component
}

export const LucideIcon = ({
  className,
  fallback = null,
  name,
  ...props
}: IconProps<{
  fallback?: React.ReactNode
  name: IconName
}>) => {
  const Icon = getIconComponent(name)

  return (
    <Suspense fallback={fallback ?? null}>
      <Icon className={cn(className)} {...props} />
    </Suspense>
  )
}
