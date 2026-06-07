'use client'

import { createContext, useEffect, useEffectEvent, useRef } from 'react'

import { type CreateTypes, type GlobalOptions, type Options, Shape } from 'canvas-confetti'

import { Button, type ButtonProps } from '@/components/ui/button'

const DEFAULT_SHAPES: Shape[] = ['square', 'circle']

const ConfettiContext = createContext<{ fire: (options?: Options) => void } | null>(null)

const loadConfetti = async () => (await import('canvas-confetti')).default

export const Confetti = ({
  angle = 90,
  children,
  colors,
  decay = 0.9,
  disableForReducedMotion,
  drift = 0,
  flat,
  gravity = 1,
  manual = false,
  origin,
  particleCount = 50,
  ref,
  resize,
  scalar = 1,
  shapes = DEFAULT_SHAPES,
  spread = 45,
  startVelocity = 45,
  ticks = 200,
  useWorker,
  zIndex = 100,
  ...props
}: React.ComponentProps<'canvas'> &
  GlobalOptions &
  Options & {
    manual?: boolean
  }) => {
  const instanceRef = useRef<CreateTypes | null>(null)

  const globalOptions = { disableForReducedMotion, resize: true, useWorker }
  const options = {
    angle,
    colors,
    decay,
    disableForReducedMotion,
    drift,
    flat,
    gravity,
    origin,
    particleCount,
    scalar,
    shapes,
    spread,
    startVelocity,
    ticks,
    zIndex,
  }

  const canvasRef = (node: HTMLCanvasElement | null) => {
    if (node !== null) {
      if (!instanceRef.current) {
        void (async () => {
          const canvasConfetti = await loadConfetti()
          instanceRef.current = canvasConfetti.create(node, globalOptions)
        })()
      }
      return
    }

    if (instanceRef.current) {
      instanceRef.current.reset()
      instanceRef.current = null
    }
  }

  const fire = useEffectEvent(async (opts?: Options) => {
    await instanceRef.current?.({ ...options, ...opts })
  })

  useEffect(() => {
    if (!manual) {
      void fire()
    }
  }, [manual])

  return (
    <ConfettiContext.Provider value={{ fire }}>
      <canvas ref={canvasRef} {...props} />
      {children}
    </ConfettiContext.Provider>
  )
}

export const ConfettiButton = ({
  effect = 'confetti',
  onClick,
  options,
  ...props
}: Omit<ButtonProps, 'effect'> & {
  effect?: 'confetti' | 'fireworks'
  options?: Options &
    GlobalOptions & {
      canvas?: HTMLCanvasElement
    }
}) => {
  const triggerFireworks = async () => {
    const confetti = await loadConfetti()
    const duration = 5 * 1000
    const animationEnd = Date.now() + duration
    const defaults = {
      spread: 360,
      startVelocity: 30,
      ticks: 60,
      zIndex: 1,
    }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) {
        return clearInterval(interval)
      }
      const particleCount = 50 * (timeLeft / duration)
      void confetti({
        ...defaults,
        ...options,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        particleCount,
      })
      void confetti({
        ...defaults,
        ...options,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        particleCount,
      })
    }, 250)
  }

  const triggerConfetti = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const confetti = await loadConfetti()
    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    await confetti({
      ...options,
      origin: {
        x: x / window.innerWidth,
        y: y / window.innerHeight,
      },
    })
  }

  const triggerEvent = async (event: React.MouseEvent<HTMLButtonElement>) => {
    switch (effect) {
      case 'fireworks':
        await triggerFireworks()
        break
      case 'confetti':
        await triggerConfetti(event)
        break
    }

    if (onClick) {
      onClick(event)
    }
  }

  return <Button onClick={triggerEvent} {...props} />
}
