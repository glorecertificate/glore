'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { useArticle } from '@/components/features/docs/article-editor/context'
import { ArticleFieldTranslateButton } from '@/components/features/docs/article-editor/field-translate-button'
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
  const [titleBusy, setTitleBusy] = useState(false)
  const [excerptBusy, setExcerptBusy] = useState(false)

  const title = (
    <span className="group/field inline-flex max-w-full min-w-0 items-start gap-3">
      <InlineInput
        aria-busy={titleBusy}
        aria-label={t('title')}
        className="-mx-1.5 -my-0.5 px-1.5 py-0.5 type-band! group-has-[[aria-expanded=true]]/field:bg-band-scrim hover:bg-band-scrim focus-visible:bg-band-scrim"
        maxLength={TITLE_MAX_LENGTH}
        onChange={event => setTitle(language, event.target.value)}
        placeholder={draft.titles[DEFAULT_LOCALE] || t('titlePlaceholder')}
        readOnly={titleBusy}
        value={draft.titles[language]}
      />
      <ArticleFieldTranslateButton
        className="shrink-0 self-center text-band-foreground hover:not-disabled:bg-band-scrim aria-expanded:bg-band-scrim"
        field="title"
        onRunningChange={setTitleBusy}
      />
    </span>
  )

  const description = (
    <span className="group/field flex items-center gap-3">
      <InlineInput
        aria-busy={excerptBusy}
        aria-label={t('excerpt')}
        className="-mx-1.5 -my-0.5 max-w-prose px-1.5 py-0.5 text-base text-band-text group-has-[[aria-expanded=true]]/field:bg-band-scrim placeholder:text-fg-placeholder hover:bg-band-scrim focus-visible:bg-band-scrim"
        keepFilled={false}
        maxLength={EXCERPT_MAX_LENGTH}
        onChange={event => setExcerpt(language, event.target.value)}
        placeholder={t('excerptPlaceholder')}
        readOnly={excerptBusy}
        value={draft.excerpts[language]}
      />
      <ArticleFieldTranslateButton
        className="shrink-0 text-band-foreground hover:not-disabled:bg-band-scrim aria-expanded:bg-band-scrim"
        field="excerpt"
        onRunningChange={setExcerptBusy}
      />
    </span>
  )

  return children({ description, title })
}
