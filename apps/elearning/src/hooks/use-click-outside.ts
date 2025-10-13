import { type RefObject, useCallback, useEffect } from 'react'

export const useClickOutside = (
  ref: RefObject<HTMLElement | undefined>,
  callback: () => void,
  addEventListener = true
) => {
  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as HTMLElement)) {
        callback()
      }
    },
    [ref, callback]
  )

  useEffect(() => {
    if (addEventListener) {
      document.addEventListener('click', handleClick)
    }

    return () => {
      document.removeEventListener('click', handleClick)
    }
  })
}
