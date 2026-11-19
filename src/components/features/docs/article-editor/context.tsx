'use client'

import { useRouter } from 'next/navigation'
import { createContext, startTransition, use, useRef, useState } from 'react'

import { type Locale } from 'next-intl'
import { parseAsStringEnum, useQueryState } from 'nuqs'

import { createDocArticle, updateDocArticle } from '@/actions/docs'
import {
  type ArticleDraft,
  ArticleSaveError,
  buildArticlePayload,
} from '@/components/features/docs/article-editor/payload'
import { DOC_AUDIENCES, type DocArticle, type DocAudience, type DocCategory } from '@/db/queries/doc'
import { DEFAULT_LOCALE, INTL_PLACEHOLDER, type IntlRecord, LOCALES } from '@/lib/i18n'

interface ArticleSaveOptions {
  locale: Locale
  publish: boolean | null
}

export interface ArticleProviderOptions {
  article?: DocArticle
  categories: DocCategory[]
  defaultCategoryId?: number
  language: Locale
}

const LANGUAGE_PARAM = 'lang'
const paramOptions = { clearOnDefault: false, history: 'replace', shallow: true } as const

const SLUG_REPLACEMENTS = [
  [/[^a-z0-9\s-]/gu, ''],
  [/\s+/gu, '-'],
  [/-{2,}/gu, '-'],
  [/^-|-$/gu, ''],
] as const

const slugify = (input: string) =>
  SLUG_REPLACEMENTS.reduce(
    (slug, [pattern, replacement]) => slug.replace(pattern, replacement),
    input.toLowerCase().trim()
  )

const toDraft = ({ article, defaultCategoryId }: Pick<ArticleProviderOptions, 'article' | 'defaultCategoryId'>) => {
  if (!article) {
    return {
      audiences: [],
      categoryId: defaultCategoryId ?? null,
      contents: { ...INTL_PLACEHOLDER },
      excerpts: { ...INTL_PLACEHOLDER },
      languages: [],
      slug: '',
      titles: { ...INTL_PLACEHOLDER },
    } satisfies ArticleDraft
  }
  return {
    audiences: DOC_AUDIENCES.filter(audience => article.audiences.includes(audience)),
    categoryId: article.categoryId,
    contents: { ...INTL_PLACEHOLDER, ...(article.content as IntlRecord) },
    excerpts: { ...INTL_PLACEHOLDER, ...(article.excerpt as IntlRecord | null) },
    languages: article.published ? LOCALES.filter(locale => article.languages.includes(locale)) : [],
    slug: article.slug,
    titles: { ...INTL_PLACEHOLDER, ...(article.title as IntlRecord) },
  } satisfies ArticleDraft
}

const localeChanged = (draft: ArticleDraft, saved: ArticleDraft, locale: Locale) =>
  draft.titles[locale] !== saved.titles[locale] ||
  draft.excerpts[locale] !== saved.excerpts[locale] ||
  draft.contents[locale] !== saved.contents[locale] ||
  draft.languages.includes(locale) !== saved.languages.includes(locale)

const useArticleProvider = (options: ArticleProviderOptions) => {
  const { replace, refresh } = useRouter()
  const [language, setLanguage] = useQueryState(
    LANGUAGE_PARAM,
    parseAsStringEnum(LOCALES).withOptions(paramOptions).withDefault(options.language)
  )
  const [article, setArticle] = useState(options.article)
  const [draft, setDraftState] = useState(() => toDraft(options))
  const [saved, setSaved] = useState(draft)
  const [saveVersion, setSaveVersion] = useState(0)
  const draftRef = useRef(draft)
  const slugTouchedRef = useRef(Boolean(options.article))
  const contentFlushRef = useRef<(() => unknown) | null>(null)

  const update = (change: (current: ArticleDraft) => ArticleDraft) => {
    draftRef.current = change(draftRef.current)
    setDraftState(draftRef.current)
  }

  const setField = (field: 'contents' | 'excerpts' | 'titles', locale: Locale, value: string) =>
    update(current => {
      const next = { ...current, [field]: { ...current[field], [locale]: value } }
      if (field !== 'titles' || locale !== DEFAULT_LOCALE || slugTouchedRef.current) return next
      return { ...next, slug: slugify(value) }
    })

  const setTitle = (locale: Locale, value: string) => setField('titles', locale, value)
  const setExcerpt = (locale: Locale, value: string) => setField('excerpts', locale, value)
  const setContent = (locale: Locale, value: string) => setField('contents', locale, value)

  const setSlug = (slug: string) => {
    slugTouchedRef.current = true
    update(current => ({ ...current, slug }))
  }

  const generateSlug = () => {
    slugTouchedRef.current = false
    update(current => ({ ...current, slug: slugify(current.titles[DEFAULT_LOCALE]) }))
  }

  const setCategory = (categoryId: number | null) => update(current => ({ ...current, categoryId }))

  const toggleAudience = (audience: DocAudience, checked: boolean) =>
    update(current => ({
      ...current,
      audiences: DOC_AUDIENCES.filter(item => (item === audience ? checked : current.audiences.includes(item))),
    }))

  const status = Object.fromEntries(
    LOCALES.map(locale => [
      locale,
      { hasUpdates: localeChanged(draft, saved, locale), published: draft.languages.includes(locale) },
    ])
  ) as Record<Locale, { hasUpdates: boolean; published: boolean }>

  const settingsChanged =
    draft.slug !== saved.slug ||
    draft.categoryId !== saved.categoryId ||
    draft.audiences.join() !== saved.audiences.join()
  const hasAnyUpdates = settingsChanged || LOCALES.some(locale => status[locale].hasUpdates)

  const saveArticle = async ({ locale, publish }: ArticleSaveOptions) => {
    await contentFlushRef.current?.()
    const current = draftRef.current
    const payload = buildArticlePayload(current, locale, publish)
    const { data, error } = article ? await updateDocArticle(article.id, payload) : await createDocArticle(payload)
    if (error || !data) throw new ArticleSaveError('SAVE_FAILED')
    const next = { ...current, languages: payload.languages, slug: payload.slug }
    draftRef.current = next
    setDraftState(next)
    setSaved(next)
    setSaveVersion(version => version + 1)
    setArticle(data)
    if (data.slug !== saved.slug) {
      replace(`/docs/articles/${data.slug}?${LANGUAGE_PARAM}=${language}`)
      return
    }
    startTransition(() => refresh())
  }

  return {
    article,
    categories: options.categories,
    contentFlushRef,
    draft,
    generateSlug,
    hasAnyUpdates,
    language,
    languageStatus: status[language],
    saveArticle,
    saveVersion,
    setCategory,
    setContent,
    setExcerpt,
    setLanguage,
    setSlug,
    setTitle,
    status,
    toggleAudience,
  }
}

const ArticleContext = createContext<ReturnType<typeof useArticleProvider> | null>(null)

export const ArticleProvider = ({ children, value }: React.PropsWithChildren<{ value: ArticleProviderOptions }>) => {
  const providerValue = useArticleProvider(value)
  return <ArticleContext.Provider value={providerValue}>{children}</ArticleContext.Provider>
}

export const useArticle = () => {
  const context = use(ArticleContext)
  if (!context) throw new Error('useArticle must be used within an ArticleProvider')
  return context
}
