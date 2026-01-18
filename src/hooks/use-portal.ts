'use client'

import { type ReactPortal, useCallback, useEffect, useState } from 'react'

import { createPortal } from 'react-dom'

import { sleep } from '@/lib/utils'

const MAX_RETRIES = 10

export interface Portal {
  render: (props: React.PropsWithChildren) => ReactPortal | null
  remove: () => void
}

/**
 * Hook to create and manage a React portal within a specified container element.
 */
export const usePortal = (name: string) => {
  const [retry, setRetry] = useState(0)

  const [portal, setPortal] = useState<Portal>({
    render: () => null,
    remove: () => {},
  })

  const create = useCallback(
    (element: HTMLElement): Portal => ({
      render: ({ children }) => createPortal(children, element),
      remove: () => {
        if (element.firstChild) {
          element.removeChild(element.firstChild)
        }
      },
    }),
    []
  )

  const findElement = useCallback(async () => {
    const element = document.querySelector<HTMLElement>(`[data-portal="${name}"]`)

    if (!element) {
      setRetry(prev => prev + 1)
      if (retry < MAX_RETRIES) {
        await sleep(50)
        return findElement()
      }
      throw new Error(`Can't find element [data-portal="${name}"]`)
    }
    return element
  }, [name, retry])

  const onMount = useCallback(async () => {
    const element = await findElement()
    element.innerHTML = ''
    portal.remove()
    const newPortal = create(element)
    setPortal(newPortal)
    return () => newPortal.remove()
  }, [create, findElement, portal])

  // biome-ignore lint/correctness: useExhaustiveDependencies
  useEffect(() => void onMount(), [])

  return portal.render
}
