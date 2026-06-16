'use client'

import { Slot } from '@radix-ui/react-slot'
import {
  AnimatePresence,
  type HTMLMotionProps,
  type MotionNodeAnimationOptions,
  type Transition,
  motion,
  useReducedMotion,
} from 'motion/react'

type AnimatedListVariant = 'card' | 'row'

const TRANSITION: Transition = {
  default: {
    duration: 0.26,
    ease: [0.22, 1, 0.36, 1],
  },
  layout: {
    type: 'spring',
    bounce: 0.18,
    duration: 0.5,
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

const AnimatedListSlot = motion.create(Slot)

export const AnimatedList = ({
  children,
  initial = false,
  mode = 'popLayout',
  ...props
}: React.ComponentProps<typeof AnimatePresence>) => (
  <AnimatePresence initial={initial} mode={mode} {...props}>
    {children}
  </AnimatePresence>
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
  const Item = asChild ? AnimatedListSlot : motion.div
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
