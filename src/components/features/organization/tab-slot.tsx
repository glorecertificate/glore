'use client'

import { useState } from 'react'

import { type LazyTab } from './lazy-tabs'

export const TabSlot = <P extends object>({ lazy, ...props }: P & { lazy: LazyTab<P> }) => {
  const [Component] = useState(() => lazy.resolved ?? lazy.Dynamic)

  return <Component {...(props as unknown as P)} />
}
