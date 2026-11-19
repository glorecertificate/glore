'use client'

import { useTranslations } from 'next-intl'

import { ArticleBody } from '@/components/features/docs/article-editor/body'
import { useArticle } from '@/components/features/docs/article-editor/context'
import { ArticleLanguageTabs } from '@/components/features/docs/article-editor/language-tabs'
import { ArticleSettings } from '@/components/features/docs/article-editor/settings'
import { ArticleTranslation } from '@/components/features/docs/article-editor/translation'
import { useI18n } from '@/components/providers/i18n'
import { useNavigationGuard } from '@/hooks/use-navigation-guard'

export const ArticleEditor = () => {
  const t = useTranslations('CourseEditor')
  const { localeItems } = useI18n()
  const { hasAnyUpdates, language } = useArticle()
  const languageLabel = localeItems.find(item => item.value === language)?.displayLabel ?? language

  useNavigationGuard(hasAnyUpdates)

  return (
    <div className="flex min-w-0 flex-col">
      <ArticleSettings />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <ArticleLanguageTabs />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('editingLanguage', { language: languageLabel })}</span>
          <ArticleTranslation />
        </div>
      </div>
      <ArticleBody key={language} />
    </div>
  )
}
