export const regionName = (value: string | null, language: string) => {
  if (!value) return null
  if (!/^[a-z]{2}$/iu.test(value)) return value
  return new Intl.DisplayNames([language], { type: 'region' }).of(value.toUpperCase()) ?? value
}
