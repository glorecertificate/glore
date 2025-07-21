import { useEffect, useState } from 'react'

import { type LocalStorageKey, type LocalStorageValue } from '@/lib/storage/types'

/**
 * Hook to manage local storage values.
 * It initializes the value from local storage and updates it when the value changes.
 */
export const useLocalStorage = <T extends LocalStorageKey>(key: T, defaultValue?: LocalStorageValue<T>) => {
  const [value, setValue] = useState<LocalStorageValue<T> | undefined>(defaultValue)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!key) return
    const localstorageValue = localStorage.getItem(key as string)
    if (localstorageValue !== null) {
      setValue(localstorageValue as LocalStorageValue<T>)
    }
    setIsInitialized(true)
  }, [key])

  useEffect(() => {
    if (!isInitialized || !key) return
    localStorage.setItem(key as string, JSON.stringify(value))
  }, [isInitialized, key, value])

  return [value, setValue] as const
}
