import { useEffect, useState } from 'react'

import { type LocalStorage } from '@/lib/storage'

/**
 * Hook to manage local storage values.
 *
 * It initializes the value from local storage and updates it when the value changes.
 */
export const useLocalStorage = <T extends keyof LocalStorage>(key: T, defaultValue?: LocalStorage[T]) => {
  const [value, setValue] = useState<LocalStorage[T] | undefined>(defaultValue)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!key) return
    const localstorageValue = localStorage.getItem(key as string)
    if (localstorageValue !== null) {
      setValue(localstorageValue as LocalStorage[T])
    }
    setIsInitialized(true)
  }, [key])

  useEffect(() => {
    if (!(isInitialized && key)) return
    localStorage.setItem(key as string, JSON.stringify(value))
  }, [isInitialized, key, value])

  return [value, setValue] as const
}
