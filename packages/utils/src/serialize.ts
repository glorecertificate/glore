/**
 *  Serializes data to ensure it is a plain object.
 */
export const serialize = <T>(data: T) => JSON.parse(JSON.stringify(data)) as T
