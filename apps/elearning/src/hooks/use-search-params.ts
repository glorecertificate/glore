import { useSearchParams as useNextSearchParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'

import { usePathname } from '@/hooks/use-pathname'

export const useSearchParams = () => {
  const searchParams = useNextSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  // biome-ignore lint: exhaustive-deps
  const set = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams]
  )

  // biome-ignore lint: exhaustive-deps
  const _delete = useCallback(
    (name: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (!params.has(name)) return
      params.delete(name)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams]
  )

  const has = useCallback((name: string) => searchParams.has(name), [searchParams])

  return {
    ...searchParams,
    has,
    set,
    delete: _delete,
  }
}
