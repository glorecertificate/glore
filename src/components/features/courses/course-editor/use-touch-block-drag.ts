import { useEffect } from 'react'

import { type useEditorRef } from 'platejs/react'

const HANDLE = '.slate-blockToolbar'
const CONTAINER = '.group\\/container'
const EDGE = 96
const SCROLL_STEP = 12

type Editor = ReturnType<typeof useEditorRef>

const blockContainers = (editor: Editor) =>
  editor.children.map(node => editor.api.toDOMNode(node)?.closest<HTMLElement>(CONTAINER) ?? null)

const targetIndex = (containers: (HTMLElement | null)[], from: number, y: number) =>
  containers.reduce((count, container, index) => {
    if (!container || index === from) return count
    const { bottom, top } = container.getBoundingClientRect()
    return y > (top + bottom) / 2 ? count + 1 : count
  }, 0)

const lineTop = (containers: (HTMLElement | null)[], from: number, to: number) => {
  const others = containers.filter((container, index) => container && index !== from) as HTMLElement[]
  if (others.length === 0) return null
  if (to === 0) return others[0].getBoundingClientRect().top
  return others[to - 1].getBoundingClientRect().bottom
}

export const useTouchBlockDrag = (editor: Editor, root: HTMLElement | null) => {
  useEffect(() => {
    if (!root) return
    const line = document.createElement('div')
    line.setAttribute('aria-hidden', 'true')
    line.dataset.slot = 'touch-drop-line'
    line.className = 'pointer-events-none fixed z-60 hidden h-0.5 rounded-full bg-brand'
    document.body.append(line)

    let drag: { container: HTMLElement; frame: number; from: number; moved: boolean; to: number; y: number } | null =
      null

    const update = () => {
      if (!drag) return
      const containers = blockContainers(editor)
      drag.to = targetIndex(containers, drag.from, drag.y)
      const top = lineTop(containers, drag.from, drag.to)
      const bounds = root.getBoundingClientRect()
      line.classList.toggle('hidden', top === null || !drag.moved)
      line.style.top = `${(top ?? 0) - 1}px`
      line.style.left = `${bounds.left + 8}px`
      line.style.width = `${bounds.width - 16}px`
    }

    const tick = () => {
      if (!drag) return
      if (drag.y < EDGE) window.scrollBy(0, -SCROLL_STEP)
      if (drag.y > window.innerHeight - EDGE) window.scrollBy(0, SCROLL_STEP)
      update()
      drag.frame = requestAnimationFrame(tick)
    }

    const finish = (commit: boolean) => {
      if (!drag) return
      cancelAnimationFrame(drag.frame)
      drag.container.style.opacity = ''
      line.classList.add('hidden')
      const { from, moved, to } = drag
      drag = null
      if (!commit || !moved || from === to) return
      editor.tf.moveNodes({ at: [from], to: [to] })
    }

    const start = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      const handle = (event.target as HTMLElement).closest(HANDLE)
      const container = handle?.closest<HTMLElement>(CONTAINER)
      if (!container) return
      const from = blockContainers(editor).indexOf(container)
      if (from === -1) return
      drag = { container, frame: 0, from, moved: false, to: from, y: event.touches[0].clientY }
    }

    const move = (event: TouchEvent) => {
      if (!drag) return
      event.preventDefault()
      drag.y = event.touches[0].clientY
      if (drag.moved) return
      drag.moved = true
      drag.container.style.opacity = '0.5'
      drag.frame = requestAnimationFrame(tick)
    }

    const end = () => finish(true)
    const cancel = () => finish(false)

    root.addEventListener('touchstart', start, { passive: true })
    root.addEventListener('touchmove', move, { passive: false })
    root.addEventListener('touchend', end)
    root.addEventListener('touchcancel', cancel)
    return () => {
      finish(false)
      line.remove()
      root.removeEventListener('touchstart', start)
      root.removeEventListener('touchmove', move)
      root.removeEventListener('touchend', end)
      root.removeEventListener('touchcancel', cancel)
    }
  }, [editor, root])
}
