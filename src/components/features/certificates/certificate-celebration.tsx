'use client'

import { useEffect } from 'react'

const storageKey = (id: number) => `glore:certificate-celebrated:${id}`

const isCelebrated = (id: number) => {
  try {
    return localStorage.getItem(storageKey(id)) !== null
  } catch {
    return true
  }
}

const markCelebrated = (id: number) => {
  try {
    localStorage.setItem(storageKey(id), '1')
  } catch (error) {
    void error
  }
}

export const CertificateCelebration = ({ id }: { id: number }) => {
  useEffect(() => {
    if (isCelebrated(id)) return
    let active = true
    const celebrate = async () => {
      const { default: confetti } = await import('canvas-confetti')
      if (!active) return
      markCelebrated(id)
      await confetti({ disableForReducedMotion: true, origin: { x: 0.5, y: 0.35 }, particleCount: 140, spread: 100 })
    }
    void celebrate()
    return () => {
      active = false
    }
  }, [id])

  return null
}
