import { z } from 'zod'

export const isHttpUrl = (value: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

export const optionalHttpUrl = (max: number, message = 'url') =>
  z
    .string()
    .trim()
    .max(max)
    .refine(value => !value || isHttpUrl(value), message)
    .transform(value => value || null)
