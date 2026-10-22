'use client'

import { useState } from 'react'

const TOLERANCE = 1

interface ScrollEdges {
  end: boolean
  scrollable: boolean
  start: boolean
}

const NO_EDGES: ScrollEdges = { end: false, scrollable: false, start: false }

export const useScrollEdges = <T extends HTMLElement>() => {
  const [edges, setEdges] = useState(NO_EDGES)

  const ref = (node: T | null) => {
    if (!node) return

    const update = () => {
      const scrollable = node.scrollWidth - node.clientWidth > TOLERANCE
      const start = scrollable && node.scrollLeft > TOLERANCE
      const end = scrollable && node.scrollLeft + node.clientWidth < node.scrollWidth - TOLERANCE
      setEdges(prev =>
        prev.end === end && prev.scrollable === scrollable && prev.start === start ? prev : { end, scrollable, start }
      )
    }

    update()
    node.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(node)
    for (const child of node.children) observer.observe(child)

    return () => {
      node.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }

  return { ...edges, ref }
}

export const scrollEdgesMask = ({ end, start }: Pick<ScrollEdges, 'end' | 'start'>, size = '1.5rem') => {
  if (!(start || end)) return undefined
  const left = start ? 'transparent' : '#000'
  const right = end ? 'transparent' : '#000'
  return `linear-gradient(to right, ${left}, #000 ${size}, #000 calc(100% - ${size}), ${right})`
}
