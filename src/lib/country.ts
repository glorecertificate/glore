export const countryName = (names: Record<string, string>, code: string) => {
  const key = code.toLowerCase()
  return Object.hasOwn(names, key) ? (names[key] as string) : code.toUpperCase()
}
