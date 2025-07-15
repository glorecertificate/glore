/**
 * Picks a random item from an array.
 */
export const randomItem = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)]

export default randomItem
