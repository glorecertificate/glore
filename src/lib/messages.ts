import 'server-only'

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { cacheLife, cacheTag } from 'next/cache'

import { and, inArray, isNotNull } from 'drizzle-orm'
import { type Locale, type Messages } from 'next-intl'

import { db } from '@/db/client'
import { messageOverrides } from '@/db/schema/message-overrides'
import { messagesTag } from '@/lib/cache'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n'
import {
  type MessageTree,
  type OverrideRow,
  type RawCatalog,
  acceptOverrides,
  applyOverrides,
  flattenMessages,
  hashMessage,
  isPrecompiled,
  mergeMessages,
} from '@/lib/message-overrides'

export const resolveLocale = (value: string | null | undefined) =>
  LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE

const isProduction = process.env.NODE_ENV === 'production'

const bundledCache = new Map<Locale, MessageTree>()

const rawCache = new Map<Locale, Promise<RawCatalog>>()

const resolved = new Map<Locale, { messages: Messages; version: string }>()

const importCatalog = async (locale: Locale) => {
  const { default: catalog } = await import(`~/messages/${locale}.json`)
  return catalog as MessageTree
}

const loadBundled = async (locale: Locale) => {
  const cached = bundledCache.get(locale)
  if (cached) return cached
  const catalog =
    locale === DEFAULT_LOCALE
      ? await importCatalog(locale)
      : mergeMessages(await importCatalog(DEFAULT_LOCALE), await importCatalog(locale))
  if (isProduction) bundledCache.set(locale, catalog)
  return catalog
}

const readRaw = async (locale: Locale) =>
  flattenMessages(JSON.parse(await readFile(path.join(process.cwd(), 'messages', `${locale}.json`), 'utf8')))

export const loadRawMessages = async (input: string | null | undefined) => {
  const locale = resolveLocale(input)
  if (!isProduction) return await readRaw(locale)
  const cached = rawCache.get(locale)
  if (cached) return await cached
  const pending = readRaw(locale)
  rawCache.set(locale, pending)
  return await pending
}

export const usesPrecompiledMessages = async () => isPrecompiled(await importCatalog(DEFAULT_LOCALE))

const queryOverrides = async (locale: Locale) => {
  'use cache'
  cacheLife('max')
  cacheTag(messagesTag(locale), messagesTag(DEFAULT_LOCALE))

  return await db
    .select({ key: messageOverrides.key, locale: messageOverrides.locale, value: messageOverrides.value })
    .from(messageOverrides)
    .where(
      and(isNotNull(messageOverrides.value), inArray(messageOverrides.locale, [...new Set([locale, DEFAULT_LOCALE])]))
    )
}

const fetchOverrides = async (locale: Locale): Promise<OverrideRow[]> => {
  try {
    return await queryOverrides(locale)
  } catch (error) {
    console.error('[messages] overrides unavailable, using the bundled catalog', error)
    return []
  }
}

const withOverrides = async (locale: Locale, rows: OverrideRow[], base: MessageTree) => {
  const [en, own, precompiled] = await Promise.all([
    loadRawMessages(DEFAULT_LOCALE),
    loadRawMessages(locale),
    usesPrecompiledMessages(),
  ])
  const gaps = new Set(Object.keys(en).filter(key => !(key in own)))
  const accepted = acceptOverrides({ en, gaps, locale, precompiled, rows, sourceLocale: DEFAULT_LOCALE })
  return applyOverrides(base, accepted) as unknown as Messages
}

export const loadMessages = async (input: string | null | undefined) => {
  const locale = resolveLocale(input)
  const [bundled, rows] = await Promise.all([loadBundled(locale), fetchOverrides(locale)])
  if (rows.length === 0) return bundled as unknown as Messages

  const version = hashMessage(JSON.stringify(rows))
  const memo = resolved.get(locale)
  if (isProduction && memo?.version === version) return memo.messages

  const messages = await withOverrides(locale, rows, bundled)
  if (isProduction) resolved.set(locale, { messages, version })
  return messages
}
