'use client'

import { useRef, useState } from 'react'

const TOLERANCE = 1

interface ScrollEdges {
  end: boolean
  scrollable: boolean
  start: boolean
}

const NO_EDGES: ScrollEdges = { end: false, scrollable: false, start: false }

interface Attachment {
  node: HTMLElement
  released: boolean
  teardown: () => void
}

export const useScrollEdges = <T extends HTMLElement>() => {
  const [edges, setEdges] = useState(NO_EDGES)
  const last = useRef(NO_EDGES)
  const attachment = useRef<Attachment | null>(null)

  const [ref] = useState(() => (node: T | null) => {
    if (!node) return

    const update = () => {
      const scrollable = node.scrollWidth - node.clientWidth > TOLERANCE
      const start = scrollable && node.scrollLeft > TOLERANCE
      const end = scrollable && node.scrollLeft + node.clientWidth < node.scrollWidth - TOLERANCE
      const prev = last.current
      if (prev.end === end && prev.scrollable === scrollable && prev.start === start) return
      last.current = { end, scrollable, start }
      setEdges(last.current)
    }

    const attach = (): Attachment => {
      attachment.current?.teardown()
      node.addEventListener('scroll', update, { passive: true })
      const observer = new ResizeObserver(update)
      observer.observe(node)
      for (const child of node.children) observer.observe(child)
      update()
      return {
        node,
        released: false,
        teardown: () => {
          node.removeEventListener('scroll', update)
          observer.disconnect()
        },
      }
    }

    const reused = attachment.current?.node === node ? attachment.current : null
    if (reused) reused.released = false
    const current = reused ?? attach()
    attachment.current = current

    return () => {
      current.released = true
      queueMicrotask(() => {
        if (!current.released || attachment.current !== current) return
        current.teardown()
        attachment.current = null
      })
    }
  })

  return { ...edges, ref }
}

export const scrollEdgesMask = ({ end, start }: Pick<ScrollEdges, 'end' | 'start'>, size = '1.5rem') => {
  if (!(start || end)) return undefined
  const left = start ? 'transparent' : '#000'
  const right = end ? 'transparent' : '#000'
  return `linear-gradient(to right, ${left}, #000 ${size}, #000 calc(100% - ${size}), ${right})`
}
