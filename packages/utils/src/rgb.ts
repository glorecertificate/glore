import { type Rgb } from './types'

/**
 * Returns RGB values as a normalized array.
 */
export const rgb = (r: number, g: number, b: number): Rgb => [r / 255, g / 255, b / 255]
