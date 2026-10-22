export const NOTIFICATIONS_CHANGED = 'glore:notifications-changed'

export const announceNotificationsChanged = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
}
