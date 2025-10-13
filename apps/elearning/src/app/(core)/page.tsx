'use client'

import { useCallback, useEffect } from 'react'

import { confetti } from '@/components/ui/confetti'

export default () => {
  const fireConfetti = useCallback(
    async () =>
      await confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff0', '#f00', '#0f0', '#00f'],
      }),
    []
  )

  // biome-ignore lint: fire once
  useEffect(() => {
    void fireConfetti()
  }, [])

  return <>{'Welcome!'}</>
}
