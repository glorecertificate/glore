/**
 * Creates a record from an array of entries.
 */
export const recordFromEntries = <T extends Record<string, any> | ArrayLike<[string, any]>>(record: T): T =>
  Object.fromEntries(Object.entries(record)) as T

export default recordFromEntries
