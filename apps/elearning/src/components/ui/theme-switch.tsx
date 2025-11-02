'use client'

import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { type Icon } from '@/components/icons/types'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Tooltip, TooltipContent, type TooltipContentProps, TooltipTrigger } from '@/components/ui/tooltip'
import { useMounted } from '@/hooks/use-mounted'
import { useTheme } from '@/hooks/use-theme'
import { type Theme } from '@/lib/theme'
import { cn } from '@/lib/utils'

export interface ThemeSwitchButtonProps extends Omit<ButtonProps, 'icon' | 'title'> {
  active: boolean
  icon: Icon
  isFirst: boolean
  isLast: boolean
  label: string
  title: string
  tooltip?: boolean | TooltipContentProps
}

export interface ThemeSwitchProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultTheme?: Theme
  tooltip?: boolean | TooltipContentProps
}

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
}: ThemeSwitchButtonProps) => {
  const tooltipProps = typeof tooltip === 'object' ? tooltip : {}

  const content = (
    <Button
      className={cn(
        'inline-flex size-[26px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-transparent px-1.5 font-medium text-sm transition-all',
        active && 'cursor-default border-border bg-accent/80 text-accent-foreground dark:bg-accent/50',
        isFirst && '-ml-px',
        isLast && '-mr-px',
        className
      )}
      data-orientation="horizontal"
      role="tab"
      title={active ? undefined : title}
      variant="ghost"
      {...props}
    >
      <div className="relative z-10 flex items-center gap-1.5">
        <Icon className={cn('size-3.5', active && 'text-foreground')} />
        <span className="sr-only">{children}</span>
      </div>
    </Button>
  )

  if (!tooltip) return content

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent {...tooltipProps}>{label}</TooltipContent>
    </Tooltip>
  )
}

export const ThemeSwitch = ({ className, defaultTheme, tooltip, ...props }: ThemeSwitchProps) => {
  const mounted = useMounted()
  const { setTheme, theme } = useTheme()
  const t = useTranslations('Theme')

  const items = [
    {
      name: 'light',
      icon: SunIcon,
      label: t('light'),
      title: t('lightTitle'),
    },
    {
      name: 'dark',
      icon: MoonIcon,
      label: t('dark'),
      title: t('darkTitle'),
    },
    {
      name: 'system',
      icon: MonitorIcon,
      label: t('system'),
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
