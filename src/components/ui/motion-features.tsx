'use client'

import { LazyMotion, domMax } from 'motion/react'

export const MotionFeatures = ({ children }: React.PropsWithChildren) => (
  <LazyMotion features={domMax} strict>
    {children}
  </LazyMotion>
)
