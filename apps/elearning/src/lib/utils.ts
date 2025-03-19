import { cx } from 'class-variance-authority'
import { type ClassValue } from 'class-variance-authority/types'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge and apply conditional class names.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(cx(inputs))

/**
 * Utility function to statically apply tailwind classes.
 */
export const tw = (raw: TemplateStringsArray, ...values: string[]) => cn(String.raw({ raw }, ...values))
