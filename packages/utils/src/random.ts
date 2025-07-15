/**
 * Generates a random integer between `min` and `max`, inclusive.
 */
export const random = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min

export default random
