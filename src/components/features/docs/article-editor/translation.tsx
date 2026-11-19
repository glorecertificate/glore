'use client'

import { useRef } from 'react'

import { type Locale, useTranslations } from 'next-intl'

import { useArticle } from '@/components/features/docs/article-editor/context'
import {
  ARTICLE_FIELDS,
  articleSources,
  planArticleTranslation,
} from '@/components/features/docs/article-editor/translation-fields'
import { useTranslate } from '@/components/features/translations/use-translate'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/toast'
import { LOCALES } from '@/lib/i18n'

export const ArticleTranslation = () => {
  const t = useTranslations('CourseTranslate')
  const tEditor = useTranslations('Docs.editor')
  const { localeItems } = useI18n()
  const { applyTranslated, draft, language } = useArticle()
  const seen = useRef<ReadonlyMap<string, string>>(new Map())
  const translate = useTranslate({ onField: event => applyTranslated(event, seen.current) })

  const running = translate.status === 'running'
  const nameOf = (locale: string) => localeItems.find(item => item.value === locale)?.label ?? locale
  const sources = articleSources(draft, ARTICLE_FIELDS, LOCALES, language)

  const run = async (source: Locale) => {
    const plan = planArticleTranslation({ draft, fields: ARTICLE_FIELDS, source, target: language })
    if (plan.fields.length === 0) return
    seen.current = plan.seen
    const ok = await translate.run({ fields: plan.fields, replace: true, source, targets: [language] })
    toast[ok ? 'success' : 'error'](ok ? t('field.done') : t('field.failed'))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button icon="languages" loading={running} variant="outline">
          {t('open')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {sources.length === 0 && (
          <DropdownMenuLabel className="max-w-64 font-normal text-muted-foreground">
            {tEditor('translateEmpty')}
          </DropdownMenuLabel>
        )}
        {sources.map(locale => (
          <DropdownMenuItem key={locale} onSelect={() => run(locale as Locale)}>
            {t('field.from', { language: nameOf(locale) })}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
