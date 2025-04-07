import { type Route } from 'next'
import { usePathname as useNextPathname } from 'next/navigation'

export type Pathname = Route | `${Route}/${string}`

export const usePathname = useNextPathname as () => Pathname
