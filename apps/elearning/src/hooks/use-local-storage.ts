'use client'

import { useCallback, useMemo, type Dispatch } from 'react'

import config from 'static/app.json'

import { isServer } from '@repo/utils'

import { type LocalStorageItem } from '@/lib/storage'

export const useLocalStorage = <T>(
  item: LocalStorageItem,
  initialValue?: T,
  options = {
    prefix: config.slug,
    separator: '/',
  },
): [T | undefined, Dispatch<T>, () => void] => {
  const key = useMemo(
    () => (options?.prefix ? `${options.prefix}${options.separator}${item}` : item),
    [item, options?.prefix, options?.separator],
  )

  const storedValue = useMemo(() => {
    if (isServer()) return initialValue
    const raw = window.localStorage.getItem(key)
    if (!raw) return initialValue
    return JSON.parse(raw) as T
  }, [key, initialValue])

  const setValue = useCallback(
    (value: T) => {
      if (isServer()) return
      window.localStorage.setItem(key, JSON.stringify(value))
    },
    [key],
  )

  const removeValue = useCallback(() => {
    if (isServer()) return
    window.localStorage.removeItem(key)
  }, [key])

  return [storedValue, setValue, removeValue]
}
