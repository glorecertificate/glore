import { useEffect, useState } from 'react'

import { type LocalStorage } from '@/lib/storage'

/**
 * Hook to manage local storage values.
 * It initializes the value from local storage and updates it when the value changes.
 */
export const useLocalStorage = <T>(key?: LocalStorage | `${LocalStorage}`, defaultValue?: T) => {
  const [value, setValue] = useState<T | undefined>(defaultValue)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!key) return
    const localstorageValue = localStorage.getItem(key)
    if (localstorageValue !== null) setValue(JSON.parse(localstorageValue) as T)
    setIsInitialized(true)
  }, [key])

  useEffect(() => {
    if (!isInitialized || !key) return
    localStorage.setItem(key, JSON.stringify(value))
  }, [isInitialized, key, value])

  return [value, setValue] as const
}
