'use client'

import { useMemo } from 'react'

import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'

import { type Icon } from '@/components/icons/types'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, type TooltipContentProps } from '@/components/ui/tooltip'
import { useMounted } from '@/hooks/use-mounted'
import { useTheme } from '@/hooks/use-theme'
import { type Theme } from '@/lib/theme'
import { cn } from '@/lib/utils'

const THEMES = [
  {
    name: 'light',
    icon: SunIcon,
    label: {
      en: 'Light',
      es: 'Claro',
      it: 'Chiaro',
    },
  },
  {
    name: 'dark',
    icon: MoonIcon,
    label: {
      en: 'Dark',
      es: 'Oscuro',
      it: 'Scuro',
    },
  },
  {
    name: 'system',
    icon: MonitorIcon,
    label: {
      en: 'System',
      es: 'Sistema',
      it: 'Sistema',
    },
  },
] as const

export interface ThemeSwitchButtonProps extends Omit<ButtonProps, 'icon' | 'title'> {
  active: boolean
  icon: Icon
  title: string
  tooltip?: boolean | TooltipContentProps
}

const ThemeSwitchButtonBase = ({
  active,
  children,
  className,
  icon: Icon,
  title,
  ...props
}: ThemeSwitchButtonProps) => (
  <Button
    className={cn(
      'inline-flex h-6 items-center justify-center gap-1.5 whitespace-nowrap px-2 font-medium text-sm transition-all',
      active && 'pointer-events-none bg-accent dark:bg-accent',
      className
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

export const ThemeSwitchButton = ({ title, tooltip, ...props }: ThemeSwitchButtonProps) => {
  const tooltipProps = useMemo(() => (typeof tooltip === 'object' ? tooltip : {}), [tooltip])

  if (!tooltip) return <ThemeSwitchButtonBase title={title} {...props} />

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ThemeSwitchButtonBase title={title} {...props} />
      </TooltipTrigger>
      <TooltipContent {...tooltipProps}>{title}</TooltipContent>
    </Tooltip>
  )
}

export interface ThemeSwitchProps<L extends keyof (typeof THEMES)[0]['label'] = 'en'>
  extends React.HTMLAttributes<HTMLDivElement> {
  locale?: L
  themes?: {
    name: Theme
    icon: Icon
    label: string | Record<L, string>
  }[]
  tooltip?: boolean | TooltipContentProps
}

export const ThemeSwitch = ({ className, locale = 'en', themes, tooltip, ...props }: ThemeSwitchProps) => {
  const { setTheme, theme } = useTheme()
  const mounted = useMounted()

  const items = useMemo(
    () =>
      (themes ?? THEMES).map(({ label, ...theme }) => ({
        ...theme,
        label: typeof label === 'string' ? label : (label[locale] ?? label.en),
      })),
    [locale, themes]
  )

  return (
    <div
      className={cn('flex h-fit items-center gap-0.5 overflow-hidden rounded-full border p-0 outline-0', className)}
      role="tablist"
      tabIndex={0}
      {...props}
    >
      {mounted
        ? items.map(({ icon, label, name }) => (
            <ThemeSwitchButton
              active={theme === name}
              icon={icon}
              key={name}
              onClick={() => setTheme(name)}
              title={label}
              tooltip={tooltip}
            >
              {name.toLowerCase()}
            </ThemeSwitchButton>
          ))
        : items.map(({ icon, name }) => (
            <ThemeSwitchButton active={false} className="w-8" icon={icon} key={name} title="" />
          ))}
    </div>
  )
}
