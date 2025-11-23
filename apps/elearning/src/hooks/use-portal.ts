'use client'

import { type ReactPortal, useCallback, useEffect, useState } from 'react'

import { createPortal } from 'react-dom'

import { type Enum } from '@glore/utils/types'

export enum PortalContainer {
  Breadcrumb = 'breadcrumb',
}

export interface Portal {
  render: (props: React.PropsWithChildren) => ReactPortal | null
  remove: () => void
}

export const usePortal = (container: Enum<PortalContainer>) => {
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
