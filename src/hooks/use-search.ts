'use client'

import { useDeferredValue } from 'react'

import { type Options, parseAsString, useQueryState } from 'nuqs'

export const useSearch = ({
  clearOnDefault = true,
  debounce,
  shallow = true,
  throttle = 200,
  urlKey = 'q',
  ...options
}: Omit<Options, 'limitUrlUpdates' | 'throttleMs'> & {
  debounce?: number
  throttle?: number
  urlKey?: string
} = {}) => {
  const timeMs = debounce ?? throttle
  const limitUrlUpdates = timeMs ? ({ method: debounce ? 'debounce' : 'throttle', timeMs } as const) : undefined

  const [searchValue, setSearch] = useQueryState(
    urlKey,
    parseAsString.withDefault('').withOptions({ clearOnDefault, limitUrlUpdates, shallow, ...options })
  )
  const search = useDeferredValue(searchValue.trim())
  const searching = search.length >= 1

  const matchSearch = (haystacks: (string | null | undefined)[]) => {
    const needle = search.toLowerCase()
    if (needle.length === 0) return true
    return haystacks.some(value => value?.toLowerCase().includes(needle))
  }

  return { search, searching, searchValue, setSearch, matchSearch }
}
