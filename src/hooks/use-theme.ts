'use client'

import { useCallback } from 'react'

import { useTheme as useNextTheme } from 'next-themes'

import { setCookie } from '@/actions/cookies'
import { type ResolvedTheme, type Theme } from '@/lib/types'

const TRANSITION_CLASS = 'theme-transition'

let transitionTimeout: number | undefined

/**
 * Extends the hook from `next-themes` to add cookie support and view transitions.
 */
export const useTheme = () => {
  const {
    setTheme: setNextTheme,
    resolvedTheme: resolvedNextTheme,
    theme: nextTheme,
    themes: nextThemes,
  } = useNextTheme()

  const applyTheme = useCallback(
    async (theme: Theme) => {
      setNextTheme(theme)
      await setCookie('theme', theme)
    },
    [setNextTheme]
  )

  const setTheme = useCallback(
    (theme: Theme) => {
      if (typeof window === 'undefined') {
        applyTheme(theme)
        return
      }

      const root = window.document.documentElement
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const doc = window.document as Document & {
        startViewTransition?: (callback: () => void) => { finished: Promise<void> }
      }

      if (!prefersReducedMotion && typeof doc.startViewTransition === 'function') {
        root.classList.add(`${TRANSITION_CLASS}-view`)

        const transition = doc.startViewTransition(() => {
          applyTheme(theme)
        })
        transition?.finished.finally(() => {
          root.classList.remove(`${TRANSITION_CLASS}-view`)
        })
        return
      }

      root.classList.add(TRANSITION_CLASS)

      if (transitionTimeout) {
        window.clearTimeout(transitionTimeout)
      }

      applyTheme(theme)

      transitionTimeout = window.setTimeout(() => {
        root.classList.remove(TRANSITION_CLASS)
      }, 250)
    },
    [applyTheme]
  )

  const resolvedTheme = resolvedNextTheme as ResolvedTheme

  return {
    isDarkMode: resolvedTheme === 'dark',
    isLightMode: resolvedTheme === 'light',
    resolvedTheme,
    setTheme,
    theme: nextTheme as Theme,
    themes: nextThemes as Theme[],
  }
}
