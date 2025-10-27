import { usePathname as useNextPathname } from 'next/navigation'
import { type AppRoutes } from 'next/types/routes'

/**
 * Typed version of Next.js's `usePathname` hook that returns
 * the current pathname as an {@link AppRoutes}.
 */
export const usePathname = useNextPathname as () => AppRoutes
