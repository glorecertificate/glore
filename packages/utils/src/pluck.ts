/**
 * Utility function to pluck a specific key from an array of objects.
 */
export const pluck = <T, K extends keyof T>(items: T[], key: K): T[K][] => items.map(item => item[key])

export default pluck
