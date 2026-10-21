'use client'

import { Slot } from '@radix-ui/react-slot'
import {
  AnimatePresence,
  type HTMLMotionProps,
  type MotionNodeAnimationOptions,
  type Transition,
  m,
  useReducedMotion,
} from 'motion/react'

import { MotionFeatures } from '@/components/ui/motion-features'
import { EASE_OUT, SPRING } from '@/lib/motion'

type AnimatedListVariant = 'card' | 'row'

const TRANSITION: Transition = {
  default: {
    duration: 0.24,
    ease: EASE_OUT,
  },
  layout: {
    ...SPRING,
    duration: 0.4,
  },
}

const ANIMATIONS: Record<AnimatedListVariant, MotionNodeAnimationOptions> = {
  card: {
    animate: {
      opacity: 1,
      scale: 1,
    },
    exit: {
      opacity: 0,
      scale: 0.92,
    },
    initial: {
      opacity: 0,
      scale: 0.96,
    },
  },
  row: {
    animate: {
      opacity: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      scale: 0.97,
      transition: {
        ...TRANSITION.default,
        duration: 0.2,
      },
    },
    initial: {
      opacity: 0,
      y: -6,
    },
  },
}

const AnimatedListSlot = m.create(Slot)

export const AnimatedList = ({
  children,
  initial = false,
  mode = 'popLayout',
  ...props
}: React.ComponentProps<typeof AnimatePresence>) => (
  <MotionFeatures>
    <AnimatePresence initial={initial} mode={mode} {...props}>
      {children}
    </AnimatePresence>
  </MotionFeatures>
)

export const AnimatedListItem = ({
  asChild,
  exitOnly,
  layout = 'position',
  ref,
  transition = TRANSITION,
  variant = 'card',
  ...props
}: HTMLMotionProps<'div'> & {
  asChild?: boolean
  exitOnly?: boolean
  variant?: AnimatedListVariant
}) => {
  const Item = asChild ? AnimatedListSlot : m.div
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return <Item layout={!exitOnly && layout} ref={ref} transition={{ duration: 0 }} {...props} />
  }

  if (exitOnly) {
    const { animate, initial, ...animation } = ANIMATIONS[variant]
    return <Item layout={false} ref={ref} transition={transition} {...animation} {...props} />
  }

  return <Item layout={layout} ref={ref} transition={transition} {...ANIMATIONS[variant]} {...props} />
}
