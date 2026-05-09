'use client'

import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { type Theme } from '@/components/providers/theme-provider'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMounted } from '@/hooks/use-mounted'
import { useTheme } from '@/hooks/use-theme'
import { type Icon } from '@/lib/types'
import { cn } from '@/lib/utils'

export const ThemeSwitchButton = ({
  active,
  children,
  className,
  icon: Icon,
  isFirst,
  isLast,
  label,
  title,
  tooltip,
  ...props
}: Omit<ButtonProps, 'icon' | 'title'> & {
  active: boolean
  icon: Icon
  isFirst: boolean
  isLast: boolean
  label: string
  title: string
  tooltip?: boolean | React.ComponentProps<typeof TooltipContent>
}) => {
  const tooltipProps = typeof tooltip === 'object' ? tooltip : {}

  const content = (
    <Button
      className={cn(
        'size-6.5 rounded-full border border-transparent px-1.5',
        active && 'cursor-default border-border bg-accent/80 text-accent-foreground dark:bg-accent/50',
        isFirst && '-ml-px',
        isLast && '-mr-px',
        className
      )}
      aria-selected={active}
      data-orientation="horizontal"
      role="tab"
      title={active ? undefined : title}
      variant="ghost"
      {...props}
    >
      <div className="relative z-10 flex items-center gap-1.5">
        <Icon className={cn('size-3.5 transition-none', active && 'text-foreground')} />
        <span className="sr-only">{children}</span>
      </div>
    </Button>
  )

  if (!tooltip || active) {
    return content
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent showArrow {...tooltipProps}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export const ThemeSwitch = ({
  className,
  defaultTheme,
  tooltip,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  defaultTheme?: Theme
  tooltip?: boolean | React.ComponentProps<typeof TooltipContent>
}) => {
  const mounted = useMounted()
  const { setTheme, theme } = useTheme()
  const t = useTranslations('Components.ThemeSwitch')

  const items = [
    {
      icon: SunIcon,
      label: t('light'),
      name: 'light',
      title: t('lightTitle'),
    },
    {
      icon: MoonIcon,
      label: t('dark'),
      name: 'dark',
      title: t('darkTitle'),
    },
    {
      icon: MonitorIcon,
      label: t('system'),
      name: 'system',
      title: t('systemTitle'),
    },
  ] as const

  const activeTheme = mounted ? theme : (defaultTheme ?? 'system')

  return (
    <div
      className={cn('flex h-fit items-center gap-0 rounded-full border p-0 outline-0', className)}
      role="tablist"
      {...props}
    >
      {items.map(({ name, ...item }, i) => (
        <ThemeSwitchButton
          active={activeTheme === name}
          isFirst={i === 0}
          isLast={i === items.length - 1}
          key={name}
          onClick={() => setTheme(name)}
          tooltip={tooltip}
          {...item}
        >
          {name.toLowerCase()}
        </ThemeSwitchButton>
      ))}
    </div>
  )
}
