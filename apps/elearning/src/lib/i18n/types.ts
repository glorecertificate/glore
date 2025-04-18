'use server'

import { type createTranslator, type NamespaceKeys, type NestedKeyOf } from 'next-intl'

import { type AnyArray, type AnyRecord } from '@repo/utils'

import type app from 'config/app.json'
import type messages from 'config/translations/en.json'

import { type formats } from './config'

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale
    Messages: Messages
    Formats: Formats
  }
}

/**
 * Application locale keys.
 */
export type Locale = keyof typeof app.locales

/**
 * Record localized to the current locale.
 */
export type Localized<T extends AnyRecord, R extends keyof T = never> = {
  [K in keyof T]: K extends R ? string : T[K] extends AnyRecord ? Localized<T[K], R> : T[K]
}

/**
 *
 * Wrapper around the `createTranslator` function from `next-intl`
 * that makes the second parameter of the function optional.
 */
export interface Translator extends Omit<ReturnType<typeof createTranslator>, 't'> {
  (
    key: Parameters<ReturnType<typeof createTranslator>>[0],
    values?: Parameters<ReturnType<typeof createTranslator>>[1],
  ): string
}

/**
 * JSON object with locale keys holding a string value.
 */
export type IntlJson = Record<Locale, string>

/**
 * Record with internationalized JSON fields.
 */
export type Intl<T extends AnyRecord, K> = {
  [P in keyof T]: T[P] extends AnyArray
    ? Array<Localized<T[P][number]>>
    : P extends K
      ? IntlJson
      : T[P] extends AnyRecord
        ? Intl<T[P], K>
        : T[P]
}

/**
 * Application static messages.
 */
export type Messages = typeof messages

/**
 * Keys of the application's static messages.
 */
export type MessageKey = Exclude<NestedKeyOf<Messages>, keyof Messages>

/**
 * Namespace keys of the application's static messages.
 */
export type NestedKey = NamespaceKeys<Messages, NestedKeyOf<Messages>>

/**
 * Formats available in the application.
 */
export type Formats = typeof formats
