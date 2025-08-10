/**
 * Generates a random integer between `min` and `max`, inclusive.
 */
import { type Any } from '@/types'

export const random = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min

/**
 * Picks a random item from an array.
 */
export const pickRandom = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)]

/**
 * Picks a random range of items from an array.
 * By default, it picks a random number of items between 0 and the length of the array.
 */
export const randomRange = <T extends Any>(items: T[], min = 0, max = items.length): T[] =>
  items.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * (max - min + 1)) + min)
