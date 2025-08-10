const BASE_UUID = '10000000-1000-4000-8000-100000000000'

/**
 * Generates a random UUID (Universally Unique Identifier) in the format 8-4-4-4-12.
 */
export const uuid = () =>
  BASE_UUID.replace(/[018]/g, s => {
    const c = Number.parseInt(s, 10)
    return (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  })
