'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(pointer: coarse)'

const subscribe = (notify: () => void) => {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', notify)
  return () => mql.removeEventListener('change', notify)
}

const getSnapshot = () => window.matchMedia(QUERY).matches

const getServerSnapshot = () => false

export const useCoarsePointer = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
