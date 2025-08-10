'use client'

import { useCallback, useEffect } from 'react'

import confetti from 'canvas-confetti'

import { usePathname } from '@/hooks/use-pathname'

export default () => {
  const { setPathname } = usePathname()

  const fireConfetti = useCallback(
    async () =>
      await confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff0', '#f00', '#0f0', '#00f'],
      }),
    [],
  )

  useEffect(() => {
    void fireConfetti()
    setPathname('/')
  }, [fireConfetti, setPathname])

  return <>{'Welcome!'}</>
}
