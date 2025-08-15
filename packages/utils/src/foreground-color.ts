import { type HexColor } from '@/types'

export interface ForegroundColorOptions {
  /** @default "#000000" */
  dark?: HexColor
  /** @default "#ffffff" */
  light?: HexColor
  /** @default 0.5 */
  threshold?: number
}

const DEFAULTS: ForegroundColorOptions = {
  dark: '#000000',
  light: '#ffffff',
  threshold: 0.5,
}

/**
 * Computes the foreground color based on the provided background color.
 *
 * @param color - The background color in hex format (e.g., "#ff0000").
 * @param options - Optional settings for dark, light colors and threshold.
 * @returns The computed foreground color in hex format.
 */
export const foregroundColor = (color: HexColor, options?: ForegroundColorOptions): string => {
  const { dark, light, threshold } = { ...DEFAULTS, ...options } as Required<ForegroundColorOptions>

  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > threshold ? dark : light
}
