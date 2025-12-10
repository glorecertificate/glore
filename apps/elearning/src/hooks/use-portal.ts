'use client'

import { type ReactPortal, useCallback, useEffect, useState } from 'react'

import { createPortal } from 'react-dom'

import config from '@config/metadata'

export const portalContainers = {
  breadcrumb: `${config.slug}-breadcrumb`,
}

export interface Portal {
  render: (props: React.PropsWithChildren) => ReactPortal | null
  remove: () => void
}

/**
 * Hook to create and manage a React portal within a specified container element.
 */
export const usePortal = (container: keyof typeof portalContainers) => {
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

  // biome-ignore lint: exhaustive-deps
  useEffect(() => {
    const element = document.getElementById(container)
    if (!element) throw new Error(`Portal container #${container} not found`)
    element.innerHTML = ''
    portal.remove()
    const newPortal = create(element)
    setPortal(newPortal)
    return () => newPortal.remove()
  }, [])

  return portal.render
}
