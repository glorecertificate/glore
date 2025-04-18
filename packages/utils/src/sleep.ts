/**
 * Sleeps for the specified number of milliseconds.
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default sleep
