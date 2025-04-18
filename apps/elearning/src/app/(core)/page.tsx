'use client'

import { useCallback, useEffect } from 'react'

import confetti from 'canvas-confetti'

export default () => {
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
  })

  return (
    <main>
      <h1 className="text-3xl font-bold tracking-tight">{'Welcome to the GloRe Network'}</h1>
    </main>
  )
}
