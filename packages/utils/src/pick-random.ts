/**
 * Picks a random item from an array.
 */
export const pickRandom = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)]
