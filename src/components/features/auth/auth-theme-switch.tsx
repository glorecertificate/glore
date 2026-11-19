import { ThemeSwitch } from '@/components/ui/theme-switch'
import { cookies } from '@/lib/cookie-store'

export const AuthThemeSwitch = async () => {
  const { get } = await cookies()
  const theme = get('theme')

  return <ThemeSwitch className="text-sm" defaultTheme={theme} tooltip={{ showArrow: false, side: 'top' }} />
}
