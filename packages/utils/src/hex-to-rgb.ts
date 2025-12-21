import type { Rgb } from './types'

/**
 * Converts a hex color string to an array of RGB values.
 */
export const hexToRgb = (hex: string): Rgb => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

/**
 * Converts a record of hex color strings to a record of RGB arrays.
 */
export const hexToRgbRecord = <T extends Record<string, string>>(record: T) =>
  Object.entries(record).reduce(
    (hexToRgbRecord, [key, value]) => {
      hexToRgbRecord[key as keyof T] = hexToRgb(value)
      return hexToRgbRecord
    },
    {} as { [K in keyof T]: Rgb }
  )
