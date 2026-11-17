export interface Shortcut {
  key: string
  mod?: boolean
}

export const SHORTCUTS = {
  filter: { key: '/' },
  search: { key: 'k', mod: true },
  sidebar: { key: '\\', mod: true },
} as const satisfies Record<string, Shortcut>

const EDITABLE_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA'])

const isEditable = (target: EventTarget | null) => {
  if (!target || !('tagName' in target)) return false
  const element = target as HTMLElement
  return EDITABLE_TAGS.has(element.tagName) || element.isContentEditable
}

export const matchesShortcut = (event: KeyboardEvent, { key, mod = false }: Shortcut) => {
  if (event.isComposing || event.altKey) return false
  if (mod !== (event.metaKey || event.ctrlKey)) return false
  if (mod && event.shiftKey) return false
  if (!mod && isEditable(event.target)) return false
  return event.key.toLowerCase() === key
}
