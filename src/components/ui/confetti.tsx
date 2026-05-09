'use client'

import { createContext, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react'

import { type CreateTypes, type GlobalOptions, type Options } from 'canvas-confetti'

import { Button, type ButtonProps } from '@/components/ui/button'
import { type Any } from '@/lib/types'

const loadConfetti = async () => {
  const { default: canvasConfetti } = await import('canvas-confetti')
  return canvasConfetti
}

const ConfettiContext = createContext<{
  fire: (options?: Options) => void
} | null>(null)

export const Confetti = ({
  children,
  globalOptions = {
    resize: true,
    useWorker: true,
  },
  manual = false,
  options,
  ref,
  ...props
}: React.ComponentProps<'canvas'> & {
  globalOptions?: GlobalOptions
  manual?: boolean
  options?: Options
}) => {
  const instanceRef = useRef<CreateTypes | null>(null)

  const canvasRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      if (node !== null) {
        if (!instanceRef.current) {
          void (async () => {
            const canvasConfetti = await loadConfetti()
            instanceRef.current = canvasConfetti.create(node, {
              ...globalOptions,
              resize: true,
            })
          })()
        }
        return
      }

      if (instanceRef.current) {
        instanceRef.current.reset()
        instanceRef.current = null
      }
    },
    [globalOptions]
  )

  const fire = useCallback(
    async (opts = {}) => {
      await instanceRef.current?.({ ...options, ...opts })
    },
    [options]
  )

  const contextValue = useMemo(
    () => ({
      fire,
    }),
    [fire]
  )

  useImperativeHandle(ref, () => contextValue as Any, [contextValue])

  useEffect(() => {
    if (!manual) {
      void (async () => await fire())()
    }
  }, [manual, fire])

  return (
    <ConfettiContext.Provider value={contextValue}>
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
  const triggerFireworks = useCallback(async () => {
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
  }, [options])

  const triggerConfetti = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
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
    },
    [options]
  )

  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
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
    },
    [effect, onClick, triggerConfetti, triggerFireworks]
  )

  return <Button onClick={handleClick} {...props} />
}
