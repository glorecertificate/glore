/**
 * Converts a string to a handle format by replacing spaces with hyphens and converting to lowercase.
 */
export const handleize = (input: string) => input.toLowerCase().replace(/\s+/g, '-')
