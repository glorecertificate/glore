import { MonitorSmartphoneIcon, MoonStarIcon, SunIcon, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'

import { Button, type ButtonProps } from '@/components/ui/button'
import { Theme } from '@/lib/theme'
import { cn } from '@/lib/utils'

interface ThemeSwitchButtonProps extends ButtonProps {
  active: boolean
  Icon: LucideIcon
}

const ThemeSwitchButton = ({ Icon, active, children, className, ...props }: ThemeSwitchButtonProps) => (
  <Button
    className={cn(
      'inline-flex h-6 items-center justify-center gap-1.5 px-2 text-sm font-medium whitespace-nowrap transition-all',
      active && 'cursor-default bg-accent',
      className,
    )}
    data-orientation="horizontal"
    role="tab"
    variant="ghost"
    {...props}
  >
    <div className="relative z-10 flex items-center gap-1.5">
      <Icon height={16} width={16} />
      <span className="sr-only">{children}</span>
    </div>
  </Button>
)

export const ThemeSwitch = ({ ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { setTheme, theme } = useTheme()
  const t = useTranslations('Common')

  return (
    <div
      className="flex h-fit items-center gap-0.5 overflow-hidden rounded-full border p-0 outline-0"
      role="tablist"
      tabIndex={0}
      {...props}
    >
      <ThemeSwitchButton
        active={theme === Theme.System}
        Icon={MonitorSmartphoneIcon}
        onClick={() => setTheme(Theme.System)}
        title={t('useSystemTheme')}
      >
        {t('system')}
      </ThemeSwitchButton>
      <ThemeSwitchButton
        active={theme === Theme.Light}
        Icon={SunIcon}
        onClick={() => setTheme(Theme.Light)}
        title={t('useLightTheme')}
      >
        {t('light')}
      </ThemeSwitchButton>
      <ThemeSwitchButton
        active={theme === Theme.Dark}
        Icon={MoonStarIcon}
        onClick={() => setTheme(Theme.Dark)}
        title={t('useDarkTheme')}
      >
        {t('dark')}
      </ThemeSwitchButton>
    </div>
  )
}
