'use client'

// biome-ignore lint/style: noRestrictedImports
import { usePathname as useNextPathname } from 'next/navigation'
import { type AppRoutes } from 'next/types/routes'

/**
 * Typed-safe version of `usePathname` returning the current pathname as {@link AppRoutes}.
 */
export const usePathname = useNextPathname as () => AppRoutes
