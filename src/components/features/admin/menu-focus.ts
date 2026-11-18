const OPEN_TRIGGER = '[data-slot="dropdown-menu-trigger"][aria-expanded="true"]'

let trigger: HTMLElement | null = null

export const rememberMenuTrigger = () => {
  trigger = document.querySelector<HTMLElement>(OPEN_TRIGGER)
}

export const restoreMenuTrigger = () => {
  if (!trigger?.isConnected) return false
  trigger.focus()
  return true
}

export const selectFromMenu = (action: () => void) => () => {
  rememberMenuTrigger()
  action()
}
