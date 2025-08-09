'use client'

import { useEffect, useMemo, useState } from 'react'

import { MonitorSmartphoneIcon, MoonStarIcon, SunIcon } from 'lucide-react'

import { Button, type ButtonProps } from '@/components/ui/button'
import { type Icon } from '@/components/ui/icons/types'
import { Tooltip, TooltipContent, TooltipTrigger, type TooltipContentProps } from '@/components/ui/tooltip'
import { useTheme } from '@/hooks/use-theme'
import { useTranslations } from '@/hooks/use-translations'
import { type MessageKey } from '@/lib/i18n/types'
import { Theme } from '@/lib/theme'
import { cn } from '@/lib/utils'

const themes: {
  name: Theme
  icon: Icon
  titleKey: MessageKey
}[] = [
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

interface ThemeButtonProps extends ButtonProps {
  active: boolean
  icon: Icon
  title: string
  tooltip?: boolean | TooltipContentProps
}

const ThemeButtonBase = ({ active, children, className, icon: Icon, title, ...props }: ThemeButtonProps) => (
  <Button
    className={cn(
      'inline-flex h-6 items-center justify-center gap-1.5 px-2 text-sm font-medium whitespace-nowrap transition-all',
      active && 'pointer-events-none bg-accent dark:bg-accent',
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
)

const ThemeButton = ({ title, tooltip, ...props }: ThemeButtonProps) => {
  const tooltipProps = useMemo(() => (typeof tooltip === 'object' ? tooltip : {}), [tooltip])

  return tooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <ThemeButtonBase title={title} {...props} />
      </TooltipTrigger>
      <TooltipContent {...tooltipProps}>{title}</TooltipContent>
    </Tooltip>
  ) : (
    <ThemeButtonBase title={title} {...props} />
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

  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
  }, [])

  return (
    <div
      className={cn('flex h-fit items-center gap-0.5 overflow-hidden rounded-full border p-0 outline-0', className)}
      role="tablist"
      tabIndex={0}
      {...props}
    >
      {loaded
        ? themes.map(({ icon, name, titleKey }) => (
            <ThemeButton
              active={theme === name}
              icon={icon}
              key={name}
              onClick={() => setTheme(name)}
              title={t.flat(titleKey)}
              tooltip={tooltip}
            >
              {name.toLowerCase()}
            </ThemeButton>
          ))
        : themes.map(({ icon, name }) => (
            <ThemeButton active={false} className="w-8" icon={icon} key={name} title="" />
          ))}
    </div>
  )
}
