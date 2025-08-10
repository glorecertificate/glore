/**
 * Retrieves the value of an environment variable using an optional default value and environment object.
 */
export const env = <T extends string>(key: string, defaultValue?: string): T => {
  const value = process.env[key] ?? defaultValue
  if (value === undefined) throw new Error(`Environment variable ${key} is not defined`)
  return value as T
}
