'use client'

import { useMemo } from 'react'

import { MonitorSmartphoneIcon, MoonStarIcon, SunIcon, type LucideIcon } from 'lucide-react'

import { Button, type ButtonProps } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, type TooltipContentProps } from '@/components/ui/tooltip'
import { useTheme } from '@/hooks/use-theme'
import { useTranslations } from '@/hooks/use-translations'
import { type MessageKey } from '@/lib/i18n/types'
import { Theme } from '@/lib/theme'
import { cn } from '@/lib/utils'

const themes: Array<{
  name: Theme
  icon: LucideIcon
  titleKey: MessageKey
}> = [
  {
    name: Theme.System,
    icon: MonitorSmartphoneIcon,
    titleKey: 'Common.useSystemTheme',
  },
  {
    name: Theme.Light,
    icon: SunIcon,
    titleKey: 'Common.useLightTheme',
  },
  {
    name: Theme.Dark,
    icon: MoonStarIcon,
    titleKey: 'Common.useDarkTheme',
  },
]

const ThemeSwitchButton = ({
  active,
  children,
  className,
  icon: Icon,
  title,
  tooltip,
  ...props
}: ButtonProps & {
  active: boolean
  icon: LucideIcon
  tooltip?: boolean | TooltipContentProps
}) => {
  const BaseButton = useMemo(
    () => (
      <Button
        className={cn(
          'inline-flex h-6 items-center justify-center gap-1.5 px-2 text-sm font-medium whitespace-nowrap transition-all',
          active && 'cursor-default bg-accent',
          className,
        )}
        data-orientation="horizontal"
        role="tab"
        title={title}
        variant="ghost"
        {...props}
      >
        <div className="relative z-10 flex items-center gap-1.5">
          <Icon height={16} width={16} />
          <span className="sr-only">{children}</span>
        </div>
      </Button>
    ),
    [active, children, className, Icon, props, title],
  )

  const contentProps = useMemo(() => (typeof tooltip === 'object' ? tooltip : {}), [tooltip])

  return tooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>{BaseButton}</TooltipTrigger>
      <TooltipContent {...contentProps}>{title}</TooltipContent>
    </Tooltip>
  ) : (
    BaseButton
  )
}

export const ThemeSwitch = ({
  className,
  tooltip,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  tooltip?: boolean | TooltipContentProps
}) => {
  const t = useTranslations()
  const { setTheme, theme } = useTheme()

  return (
    <div
      className={cn('flex h-fit items-center gap-0.5 overflow-hidden rounded-full border p-0 outline-0', className)}
      role="tablist"
      tabIndex={0}
      {...props}
    >
      {themes.map(({ icon, name, titleKey }) => (
        <ThemeSwitchButton
          active={theme === name}
          icon={icon}
          key={name}
          onClick={() => setTheme(name)}
          title={t(titleKey)}
          tooltip={tooltip}
        >
          {name.toLowerCase()}
        </ThemeSwitchButton>
      ))}
    </div>
  )
}
