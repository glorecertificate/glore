import { type Any } from '@/types'

/**
 * Picks a range of random items from an array.
 */
export const pickRandomRange = <T extends Any>(items: T[], n = 1): T[] => {
  if (n === 0) return []
  const index = Math.floor(Math.random() * items.length)
  return items.slice(index, index + n)
}
