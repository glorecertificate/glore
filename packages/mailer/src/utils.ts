import { cx } from 'class-variance-authority'
import { type ClassValue } from 'class-variance-authority/types'
import IntlMessageFormat, { type FormatXMLElementFn, type PrimitiveType } from 'intl-messageformat'
import { twMerge } from 'tailwind-merge'

import { type Locale } from '@glore/i18n'
import { type Any } from '@glore/utils/types'

import { mailerConfig } from './config'
import { type EmailProps, type EmailTemplate } from './types'

/**
 * Dynamically imports a module.
 *
 * @param path - The path to the module to import.
 * @returns A promise that resolves to the default export of the module.
 */
export const importAsync = async <T>(path: string) => (await import(`${path}`)).default as T

/**
 * Returns the full URL of an asset stored in the email storage.
 */
export const assetUrl = (file: keyof typeof mailerConfig.assets) =>
  `${mailerConfig.storageUrl}/${mailerConfig.assets[file]}`

/**
 * Merges and Tailwind CSS classes conditionally.
 *
 * @see {@link https://ui.shadcn.com/docs/installation/manual#add-a-cn-helper|shadcn/ui}
 */
export const cn = (...inputs: ClassValue[]) => twMerge(cx(inputs))

/**
 * Creates a formatter function for the specified locale.
 */
export const createFormatter =
  (locale: Locale) => (input: string, values?: Record<string, PrimitiveType | FormatXMLElementFn<string, Any>>) =>
    new IntlMessageFormat(input, locale).format(values)

/**
 * Defines the preview props for the given email template.
 */
export const previewProps = <T extends EmailTemplate>({
  t,
  ...props
}: Omit<EmailProps<T>, 'f' | 't'> & { t: Omit<EmailProps<T>['t'], 'common'> }) => ({
  ...props,
  f: mailerConfig.preview.formatter,
  t: { ...t, common: mailerConfig.preview.common },
})
