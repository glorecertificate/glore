import { cx } from 'class-variance-authority'
import { type ClassValue } from 'class-variance-authority/types'
import { twMerge } from 'tailwind-merge'

import { mailer } from './config'
import { type EmailProps, type EmailTemplate } from './types'

/**
 * Dynamically imports a module.
 *
 * @param path - The path to the module to import.
 * @returns A promise that resolves to the default export of the module.
 */
export const importAsync = async <T>(path: string) => (await import(path)).default as T

/**
 * Returns the full URL of an asset stored in the email storage.
 */
export const assetUrl = (file: keyof typeof mailer.assets) => `${mailer.storageUrl}/${mailer.assets[file]}`

/**
 * Merges and Tailwind CSS classes conditionally.
 *
 * @see {@link https://ui.shadcn.com/docs/installation/manual#add-a-cn-helper|shadcn/ui}
 */
export const cn = (...inputs: ClassValue[]) => twMerge(cx(inputs))

/**
 * Defines the preview props for the given email template.
 */
export const previewProps = <T extends EmailTemplate>({
  t,
  ...props
}: Omit<EmailProps<T>, 'f' | 't'> & { t: Omit<EmailProps<T>['t'], 'common'> }) => ({
  ...props,
  f: mailer.preview.formatter,
  t: { ...t, common: mailer.preview.common },
})
