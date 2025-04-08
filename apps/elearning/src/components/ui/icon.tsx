'use client'

import dynamic from 'next/dynamic'
import { memo, useMemo } from 'react'

import { AwardIcon, BookOpenIcon, CogIcon, MessageCircleQuestionIcon, type LucideIcon, type LucideProps } from 'lucide-react'
import dynamicIconImports from 'lucide-react/dynamicIconImports'

import { DashboardIcon } from '@/components/ui/icons/dashboard-icon'
import { cn } from '@/lib/utils'

export type IconName = keyof typeof iconImports

export interface DynamicIconProps extends LucideProps {
  name: IconName
}

const iconImports = {
  ...dynamicIconImports,
  dashboard: () => import('./icons/dashboard-icon').then(mod => mod.DashboardIcon),
}

const dynamicIcons = Object.keys(iconImports).reduce(
  (icons, name) => ({
    ...icons,
    [name]: dynamic(iconImports[name as IconName], {
      ssr: false,
    }),
  }),
  {} as Record<IconName, LucideIcon>,
)

export const DynamicIcon = memo(({ name, ...props }: DynamicIconProps) => {
  const Icon = dynamicIcons[name]
  return <Icon {...props} />
})

export const AppRouteIcon = memo(({ className, color, name, ...props }: DynamicIconProps) => {
  const Icon = useMemo(() => {
    switch (name) {
      case 'award':
        return AwardIcon
      case 'book-open':
        return BookOpenIcon
      case 'cog':
        return CogIcon
      case 'dashboard':
        return DashboardIcon
      case 'message-circle-question':
        return MessageCircleQuestionIcon
    }
  }, [name])

  const styles = useMemo(
    () => cn(color && color === 'muted' ? 'text-muted-foreground' : `text-${color}`, className),
    [className, color],
  )

  if (!Icon) return <DynamicIcon className={styles} name={name} {...props} />
  return <Icon className={styles} {...props} />
})
