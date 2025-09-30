import { type Rgb } from './types'

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
export const rgbRecord = <T extends Record<string, string>>(record: T) =>
  Object.entries(record).reduce(
    (rgbRecord, [key, value]) => {
      rgbRecord[key as keyof T] = hexToRgb(value)
      return rgbRecord
    },
    {} as { [K in keyof T]: Rgb }
  )

/**
 * Converts a hex color string to an array of normalized RGB values (0 to 1 range).
 */
export const rgbArray = (hex: string) => hexToRgb(hex).map(rgb => rgb / 255) as [number, number, number]

/**
 * Converts a record of hex color strings to a record of normalized RGB arrays (0 to 1 range).
 */
export const rgbArrayRecord = <T extends Record<string, string>>(record: T) =>
  Object.entries(record).reduce(
    (rgbRecord, [key, value]) => {
      rgbRecord[key as keyof T] = rgbArray(value)
      return rgbRecord
    },
    {} as { [K in keyof T]: [number, number, number] }
  )
