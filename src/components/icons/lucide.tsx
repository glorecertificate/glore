import { Suspense, lazy } from 'react'

import { dynamicIconImports } from 'lucide-react/dynamic'

import { type IconName, type IconProps } from '@/lib/types'
import { cn } from '@/lib/utils'

const iconCache = new Map<string, React.LazyExoticComponent<React.ComponentType<{ className?: string }>>>()

const getIconComponent = (name: IconName) => {
  if (iconCache.has(name)) {
    return iconCache.get(name)
  }
  const importFn = dynamicIconImports[name]
  if (!importFn) {
    return
  }
  const component = lazy(importFn)
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
  if (!Icon) {
    return fallback
  }

  return (
    <Suspense fallback={fallback ?? null}>
      <Icon className={cn(className)} {...props} />
    </Suspense>
  )
}
