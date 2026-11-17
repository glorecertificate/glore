'use client'

import { useSyncExternalStore } from 'react'

import { modifierKeyFor } from '@/lib/keyboard'

const subscribe = () => () => {}

export const useModifierKey = () =>
  useSyncExternalStore(
    subscribe,
    () => modifierKeyFor(navigator.userAgent),
    () => '⌘'
  )
