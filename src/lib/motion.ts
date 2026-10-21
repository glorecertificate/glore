import { type Transition } from 'motion/react'

export const EASE_OUT = [0.23, 1, 0.32, 1] as const

export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const

export const SPRING = { bounce: 0, duration: 0.3, type: 'spring' } as const satisfies Transition

export const TRANSITION = { duration: 0.2, ease: EASE_OUT } as const satisfies Transition
