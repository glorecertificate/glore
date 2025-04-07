import { usePathname as useNextPathname } from 'next/navigation'

import { type Pathname } from '@/lib/navigation'

export const usePathname = useNextPathname as () => Pathname
