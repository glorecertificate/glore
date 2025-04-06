import { cx } from 'class-variance-authority'
import type { ClassValue } from 'class-variance-authority/types'
import { twMerge } from 'tailwind-merge'

/**
 * Merges and applies class name values conditionally.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(cx(inputs))

/**
 * Statically applies and verifies Tailwind class names.
 */
export const tw = (raw: TemplateStringsArray, ...values: string[]) => cn(String.raw({ raw }, ...values))
