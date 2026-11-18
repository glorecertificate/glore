'use client'

import dynamic from 'next/dynamic'
import { type ComponentType, createElement } from 'react'

export const resolvedDynamic = <P extends object>(load: () => Promise<ComponentType<P>>, fallback: ComponentType) => {
  const Dynamic = dynamic(load, { loading: () => createElement(fallback), ssr: false })
  let resolved: ComponentType<P> | null = null

  const preload = async () => {
    resolved = await load()
  }

  const Component = (props: P) => {
    const Current = resolved ?? Dynamic
    return <Current {...props} />
  }

  return { Component, preload }
}
