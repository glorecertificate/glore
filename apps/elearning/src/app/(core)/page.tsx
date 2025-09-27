'use client'

import { useCallback, useEffect } from 'react'

import { confetti } from '@repo/ui/components/confetti'

import { useNavigation } from '@/hooks/use-navigation'

export default () => {
  const { setUiPathname } = useNavigation()

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
    setUiPathname('/')
  }, [fireConfetti, setUiPathname])

  return <>{'Welcome!'}</>
}
