import { type ExternalToast, toast as sonner } from 'sonner'

export type { ExternalToast }

type Message = Parameters<typeof sonner>[0]

export const TOAST_DURATIONS = {
  error: 8000,
  info: 4000,
  success: 2500,
  warning: 6000,
} as const

const show = (message: Message, data?: ExternalToast) => sonner(message, data)

export const toast = Object.assign(show, {
  error: (message: Message, data?: ExternalToast) =>
    sonner.error(message, { duration: TOAST_DURATIONS.error, ...data }),
  info: (message: Message, data?: ExternalToast) => sonner.info(message, { duration: TOAST_DURATIONS.info, ...data }),
  success: (message: Message, data?: ExternalToast) =>
    sonner.success(message, { duration: TOAST_DURATIONS.success, ...data }),
  warning: (message: Message, data?: ExternalToast) =>
    sonner.warning(message, { duration: TOAST_DURATIONS.warning, ...data }),
})
