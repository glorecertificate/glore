import { useCallback } from 'react'

type PossibleRef<T> = React.Ref<T> | undefined

const setRef = <T>(ref: PossibleRef<T>, value: T) => {
  if (typeof ref === 'function') return ref(value)
  if (ref !== null && ref !== undefined) ref.current = value
}

const composeRefs =
  <T>(...refs: PossibleRef<T>[]): React.RefCallback<T> =>
  node => {
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
  }

/**
 * Custom hook to compose multiple refs. Accepts callback refs and `RefObject`(s).
 */
export const useComposedRefs = <T>(...refs: PossibleRef<T>[]): React.RefCallback<T> => {
  // biome-ignore lint/correctness/useExhaustiveDependencies: memoize all values
  return useCallback(composeRefs(...refs), refs)
}
