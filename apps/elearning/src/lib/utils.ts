import { cx } from 'class-variance-authority'
import { type ClassValue } from 'class-variance-authority/types'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Merges and deduplicates Tailwind CSS classes.
 *
 * @see {@link https://github.com/dcastil/tailwind-merge|tailwind-merge}
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
 * Merges Tailwind CSS classes conditionally.
 *
 * @see {@link https://ui.shadcn.com/docs/installation/manual#add-a-cn-helper|shadcn/ui}
 */
export const cn = (...inputs: ClassValue[]) => twMerge(cx(inputs))

/**
 * Statically validates and applies Tailwind CSS classes.
 */
export const tw = (raw: TemplateStringsArray, ...values: string[]) => cn(String.raw({ raw }, ...values))
