'use client'

import { useRef } from 'react'

import { useTheme as useNextTheme } from 'next-themes'

import { type ResolvedTheme, type Theme } from '@/components/providers/theme-provider'
import { useCookies } from '@/hooks/use-cookies'

const THEME_TRANSITION_CLASS = 'theme-transition'

let transitionTimeout: number | undefined

/**
 * Extends the hook from `next-themes` to add cookie support and view transitions.
 */
export const useTheme = () => {
  const cookies = useCookies()
  const cookiesRef = useRef(cookies)
  cookiesRef.current = cookies

  const nextTheme = useNextTheme()
  const theme = nextTheme.theme as Theme
  const themes = nextTheme.themes as Theme[]
  const resolvedTheme = nextTheme.resolvedTheme as ResolvedTheme

  const applyTheme = (newTheme: Theme) => {
    nextTheme.setTheme(newTheme)
    cookiesRef.current.set('theme', newTheme)
  }

  const setTheme = async (newTheme: Theme) => {
    if (typeof window === 'undefined') {
      applyTheme(newTheme)
      return
    }

    const root = window.document.documentElement
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const doc = window.document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> }
    }

    if (!prefersReducedMotion && typeof doc.startViewTransition === 'function') {
      root.classList.add(`${THEME_TRANSITION_CLASS}-view`)

      const transition = doc.startViewTransition(() => {
        applyTheme(newTheme)
      })

      try {
        await transition?.finished
      } finally {
        root.classList.remove(`${THEME_TRANSITION_CLASS}-view`)
      }
      return
    }

    root.classList.add(THEME_TRANSITION_CLASS)

    if (transitionTimeout) {
      window.clearTimeout(transitionTimeout)
    }

    applyTheme(newTheme)

    transitionTimeout = window.setTimeout(() => {
      root.classList.remove(THEME_TRANSITION_CLASS)
    }, 250)
  }

  return {
    isDarkMode: resolvedTheme === 'dark',
    isLightMode: resolvedTheme === 'light',
    resolvedTheme,
    setTheme,
    theme,
    themes,
  }
}
