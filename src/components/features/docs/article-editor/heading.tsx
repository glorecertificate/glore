'use client'

import { useTranslations } from 'next-intl'

import { useArticle } from '@/components/features/docs/article-editor/context'
import { InlineInput } from '@/components/ui/inline-input'
import { DEFAULT_LOCALE } from '@/lib/i18n'

interface ArticleHeadingParts {
  description: React.ReactNode
  title: React.ReactNode
}

const TITLE_MAX_LENGTH = 200
const EXCERPT_MAX_LENGTH = 1000

export const ArticleHeading = ({ children }: { children: (parts: ArticleHeadingParts) => React.ReactNode }) => {
  const t = useTranslations('Docs.editor')
  const { draft, language, setExcerpt, setTitle } = useArticle()

  const title = (
    <InlineInput
      aria-label={t('title')}
      className="-mx-1.5 -my-0.5 px-1.5 py-0.5 type-band! hover:bg-band-scrim focus-visible:bg-band-scrim"
      maxLength={TITLE_MAX_LENGTH}
      onChange={event => setTitle(language, event.target.value)}
      placeholder={draft.titles[DEFAULT_LOCALE] || t('titlePlaceholder')}
      value={draft.titles[language]}
    />
  )

  const description = (
    <InlineInput
      aria-label={t('excerpt')}
      className="-mx-1.5 -my-0.5 max-w-prose px-1.5 py-0.5 text-base text-band-text placeholder:text-band-muted hover:bg-band-scrim focus-visible:bg-band-scrim"
      keepFilled={false}
      maxLength={EXCERPT_MAX_LENGTH}
      onChange={event => setExcerpt(language, event.target.value)}
      placeholder={t('excerptPlaceholder')}
      value={draft.excerpts[language]}
    />
  )

  return children({ description, title })
}
