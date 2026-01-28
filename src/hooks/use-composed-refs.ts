'use client'

import { useCallback } from 'react'

const setRef = <T>(ref: React.Ref<T> | undefined, value: T) => {
  if (typeof ref === 'function') return ref(value)
  if (ref !== null && ref !== undefined) ref.current = value
}

/**
 * Composes multiple refs, accepts callback refs and {@link React.RefObject}.
 */
export const useComposedRefs = <T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> =>
  useCallback(node => {
    let hasCleanup = false

    const cleanups = refs.map(ref => {
      const cleanup = setRef(ref, node)
      if (!hasCleanup && typeof cleanup === 'function') {
        hasCleanup = true
      }
      return cleanup
    })

    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i]
          if (typeof cleanup === 'function') {
            cleanup()
            continue
          }
          setRef(refs[i], null)
        }
      }
    }
    // biome-ignore lint: correctness/useExhaustiveDependencies
  }, refs)
