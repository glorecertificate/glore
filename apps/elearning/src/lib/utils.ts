import { cx } from 'class-variance-authority'
import type { ClassValue } from 'class-variance-authority/types'
import { extendTailwindMerge } from 'tailwind-merge'

import { type Json } from '@repo/utils'

import { type Locale } from '@/lib/i18n/types'
import config from 'config/app.json'

const twMerge = extendTailwindMerge<'text-stroke-width' | 'text-stroke-color'>({
  extend: {
    classGroups: {
      'text-stroke-width': [{ 'text-stroke': [(n: string) => Number(n) > 0] }],
      'text-stroke-color': [{ 'text-stroke': [(n: string) => !Number(n)] }],
    },
  },
})

/**
 * Merges and applies class values conditionally.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(cx(inputs))

/**
 * Statically merges, applies and verifies Tailwind class names.
 */
export const tw = (raw: TemplateStringsArray, ...values: string[]) => cn(String.raw({ raw }, ...values))

/**
 * Localizes a JSON value based on the provided locale.
 */
export const localizeJson = (value: Json, locale: Locale): string => {
  if (typeof value === 'string') return value
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return String(value)
  return typeof value[locale] === 'string' ? value[locale] : (value[config.defaultLocale] as string) || ''
}
