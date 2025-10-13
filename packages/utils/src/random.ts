import { type Any } from './types'

/**
 * Generates a random integer between `min` and `max`, inclusive.
 */
export const random = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min

/**
 * Picks a random item from an array.
 */
export const randomItem = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)]

/**
 * Picks a random range of items from an array between `min` and `max` length.
 *
 * Defaults to picking between 0 and the full length of the array.
 */
export const randomRange = <T extends Any>(items: T[], min = 0, max = items.length): T[] =>
  items.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * (max - min + 1)) + min)

/**
 * Generates an array of unique random numbers between `min` and `max`.
 */
export const randomNumbers = (min: number, max: number, count: number) => {
  const numbers = []
  while (numbers.length < count) {
    const r = Math.floor(Math.random() * (max - min)) + min
    if (numbers.indexOf(r) === -1) numbers.push(r)
  }
  return numbers
}
