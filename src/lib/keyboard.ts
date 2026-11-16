import { describeUserAgent } from '@/lib/user-agent'

const APPLE_SYSTEMS = new Set(['iOS', 'macOS'])

export const modifierKeyFor = (userAgent: string | null | undefined) =>
  APPLE_SYSTEMS.has(describeUserAgent(userAgent).system ?? '') ? '⌘' : 'Ctrl'
