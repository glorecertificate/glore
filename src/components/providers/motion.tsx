'use client'

import { MotionConfig } from 'motion/react'

import { TRANSITION } from '@/lib/motion'

export const MotionProvider = ({ children }: React.PropsWithChildren) => (
  <MotionConfig reducedMotion="user" transition={TRANSITION}>
    {children}
  </MotionConfig>
)
