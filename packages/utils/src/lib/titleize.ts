/**
 * Titleizes a string by capitalizing the first letter of each word.
 */
export const titleize = (input: string) => {
  const words = input.split(' ')
  const capitalizedWords = words.map(word => {
    if (word.length > 3) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    }
    return word.toLowerCase()
  })
  return capitalizedWords.join(' ')
}
