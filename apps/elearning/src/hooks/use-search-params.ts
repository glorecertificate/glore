import { useSearchParams as useNextSearchParams, useRouter } from 'next/navigation'

import { usePathname } from '@/hooks/use-pathname'

export const useSearchParams = () => {
  const searchParams = useNextSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const set = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set(key, value)
    replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    })
  }

  const remove = (key: string) => {
    const params = new URLSearchParams(searchParams)
    params.delete(key)
    const stringifiedParams = params.toString()
    replace(`${pathname}${stringifiedParams ? `?${stringifiedParams}` : ''}}`, {
      scroll: false,
    })
  }

  return { ...searchParams, delete: remove, set }
}
