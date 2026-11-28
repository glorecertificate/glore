type ProgressEvent = 'change' | 'commit'

const INTENT_TIMEOUT = 8000

const listeners = new Set<(event: ProgressEvent) => void>()
let holds = 0
let intent: ReturnType<typeof setTimeout> | undefined

const emit = (event: ProgressEvent) => {
  for (const listener of listeners) listener(event)
}

const clearIntent = () => {
  clearTimeout(intent)
  intent = undefined
}

export const navigationProgress = {
  active: () => holds > 0 || intent !== undefined,
  begin: () => {
    clearTimeout(intent)
    intent = setTimeout(() => {
      intent = undefined
      emit('change')
    }, INTENT_TIMEOUT)
    emit('change')
  },
  commit: () => {
    if (intent === undefined) return
    clearIntent()
    emit('commit')
  },
  hold: () => {
    holds += 1
    emit('change')
    return () => {
      holds -= 1
      emit('change')
    }
  },
  subscribe: (listener: (event: ProgressEvent) => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

interface ClickKeys {
  altKey: boolean
  button: number
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
}

interface LinkTarget {
  download: boolean
  href: string
  target: string
}

export const leavesPage = (click: ClickKeys, link: LinkTarget, current: { href: string; pathname: string }) => {
  if (click.button !== 0 || click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return false
  if ((link.target && link.target !== '_self') || link.download) return false
  const url = new URL(link.href, current.href)
  return url.origin === new URL(current.href).origin && url.pathname !== current.pathname
}
