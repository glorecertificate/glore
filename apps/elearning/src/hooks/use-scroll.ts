import { useCallback, useEffect, useMemo, useState } from 'react'

import { isServer } from '@repo/utils/is-server'

/**
 * Hook to track the current scroll position of the window.
 *
 * It provides the current scroll position and a boolean indicating if the page is scrolled.
 */
export const useScroll = () => {
  const getCurrentScroll = useCallback(
    () =>
      isServer()
        ? 0
        : window.pageYOffset !== undefined
          ? window.pageYOffset
          : (document.documentElement || document.body.parentNode || document.body).scrollTop,
    [],
  )

  const [scroll, setScroll] = useState(getCurrentScroll())
  const scrolled = useMemo(() => scroll > 0, [scroll])

  const onWindowScroll = useCallback(() => {
    const scroll = getCurrentScroll()
    setScroll(scroll)
  }, [getCurrentScroll])

  useEffect(() => {
    if (isServer()) return
    window.addEventListener('scroll', onWindowScroll)
    return () => {
      window.removeEventListener('scroll', onWindowScroll)
    }
  }, [onWindowScroll])

  return { scroll, scrolled }
}
