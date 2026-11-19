'use client'

import { createContext, use, useState } from 'react'

import { Globe, type GlobeColorOptions } from '@/components/ui/globe'
import { useTheme } from '@/hooks/use-theme'
import { AuthView, type Enum } from '@/lib/types'
import { hexToRgb } from '@/lib/utils'
import theme from '~/config/theme.json'

interface AuthGlobeState {
  errored: boolean
  view: Enum<AuthView>
}

interface AuthGlobeContext {
  setState: React.Dispatch<React.SetStateAction<AuthGlobeState>>
  state: AuthGlobeState
}

const AuthGlobeContext = createContext<AuthGlobeContext | null>(null)

export const AUTH_GLOBE_IDLE: AuthGlobeState = { errored: false, view: 'login' }

export const AuthGlobeProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthGlobeState>(AUTH_GLOBE_IDLE)
  return <AuthGlobeContext value={{ setState, state }}>{children}</AuthGlobeContext>
}

export const useSetAuthGlobe = () => {
  const context = use(AuthGlobeContext)
  if (!context) throw new Error('useSetAuthGlobe must be used within AuthGlobeProvider')
  return context.setState
}

const useGlobeOptions = ({ errored, view }: AuthGlobeState) => {
  const { resolvedTheme } = useTheme()
  const mode = resolvedTheme ?? 'light'
  const index = mode === 'dark' ? 1 : 0
  const colors = hexToRgb({
    ...theme.colors[mode],
    globe: theme.system.palette['sidebar-ring'][index]!,
    panel: theme.system.palette.sidebar[index]!,
  })
  const options: GlobeColorOptions = { baseColor: colors.globe, glowColor: colors.panel }

  if (errored || view === 'invalid_token' || view === 'invalid_password_reset') {
    return { ...options, baseColor: colors.destructive }
  }

  switch (view) {
    case 'password_request':
    case 'password_reset':
      return { ...options, baseColor: colors.warning }
    case 'password_updated':
    case 'email_sent':
      return { ...options, baseColor: colors.success }
    default:
      return options
  }
}

export const AuthGlobe = ({ className }: { className?: string }) => {
  const context = use(AuthGlobeContext)
  const options = useGlobeOptions(context?.state ?? AUTH_GLOBE_IDLE)

  return <Globe className={className} devicePixelRatio={1.5} transitionDuration={600} {...options} />
}
