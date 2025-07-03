import { cx } from 'class-variance-authority'
import type { ClassValue } from 'class-variance-authority/types'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS class names, extending the functionality to include additional class groups.
 */
export const twMerge = extendTailwindMerge<'text-stroke-width' | 'text-stroke-color'>({
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
