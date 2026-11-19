'use client'

import { type Route } from 'next'
import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { ArticleEditor } from '@/components/features/docs/article-editor'
import { CategoryManagerTrigger } from '@/components/features/docs/page-controls'
import { useDocsSearch } from '@/components/features/docs/use-docs-search'
import { useHelpRole } from '@/components/features/help/use-help-role'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { useSession } from '@/components/providers/session'
import { useSettings } from '@/components/providers/settings'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Link } from '@/components/ui/link'
import { SearchInput } from '@/components/ui/search'
import { type DocArticle, type DocCategory } from '@/db/queries/doc'
import { pickLocale } from '@/db/queries/learning'
import { SHORTCUTS } from '@/lib/shortcuts'

const START_SLUGS = ['what-is-glore', 'how-certification-works', 'roles', 'getting-started']
const BROWSABLE = ['intro', 'tutorials', 'faq']
const COLUMN_PREVIEW = 5

interface DocsListProps {
  categories: DocCategory[]
  canEdit: boolean
}

const useRoleTutorial = () => {
  const role = useHelpRole()
  const { user } = useSession()

  if (role === 'team') return user.isAdmin ? 'tutorial-platform-admin' : 'tutorial-editor'
  if (role === 'manager') {
    return user.isRepresentative ? 'tutorial-organization-representative' : 'tutorial-organization-owner'
  }
  return `tutorial-${role}`
}

const ArticleLink = ({ article }: { article: DocArticle }) => {
  const { locale } = useI18n()

  return (
    <Link
      className="flex min-h-11 items-center justify-between gap-3 rounded-lg p-2 text-sm text-fg-1 transition-colors hover:bg-surface-hover focus-visible:focus-ring-inset sm:min-h-9"
      href={`/docs/articles/${article.slug}`}
    >
      <span className="min-w-0 text-pretty">{pickLocale(article.title, locale) ?? article.slug}</span>
      <LucideIcon className="size-3.5 shrink-0 text-fg-3" name="chevron-right" />
    </Link>
  )
}

const TopicColumn = ({
  allCategories,
  canEdit,
  category,
}: {
  allCategories: DocCategory[]
  canEdit: boolean
  category: DocCategory
}) => {
  const t = useTranslations('Docs')
  const { localize } = useI18n()
  const [editorOpen, setEditorOpen] = useState(false)
  const browsable = BROWSABLE.includes(category.slug)
  const shown = browsable ? category.articles.slice(0, COLUMN_PREVIEW) : category.articles

  return (
    <section className="flex min-w-0 flex-col gap-2 rounded-xl border border-border-subtle bg-card p-4 shadow-card">
      <div className="flex items-baseline justify-between gap-3 px-2">
        <h2 className="type-heading text-fg-title">{localize(category.title)}</h2>
        <span className="type-caption text-fg-2 tabular-nums">{category.articles.length}</span>
      </div>
      {shown.length === 0 && <p className="px-2 text-sm text-fg-2">{t('empty')}</p>}
      <div className="flex flex-col">
        {shown.map(article => (
          <ArticleLink article={article} key={article.id} />
        ))}
      </div>
      {browsable && category.articles.length > COLUMN_PREVIEW && (
        <Link
          className="mt-1 inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-medium text-action-text hover:underline focus-visible:focus-ring sm:min-h-9"
          href={`/docs/${category.slug}` as Route}
        >
          {t('hub.seeAll', { count: category.articles.length })}
          <LucideIcon className="size-3.5" name="arrow-right" />
        </Link>
      )}
      {canEdit && (
        <>
          <Button className="mt-1 w-fit" onClick={() => setEditorOpen(true)} size="sm" variant="outline">
            <LucideIcon className="size-4" name="plus" />
            {t('editor.newArticle')}
          </Button>
          <ArticleEditor
            categories={allCategories}
            defaultCategoryId={category.id}
            onOpenChange={setEditorOpen}
            open={editorOpen}
          />
        </>
      )}
    </section>
  )
}

export const DocsList = ({ canEdit, categories }: DocsListProps) => {
  const [query, setQuery] = useState('')

  const tHelp = useTranslations('Help')
  const tSearch = useTranslations('Search')
  const t = useTranslations('Docs')
  const { locale } = useI18n()
  const { email, website } = useSettings()
  const tutorialSlug = useRoleTutorial()

  const docs = useDocsSearch(categories)
  const term = query.trim()
  const results = term ? docs.search(term, 500) : []

  const articles = categories.flatMap(category => category.articles)
  const bySlug = (slug: string) => articles.find(article => article.slug === slug)
  const startArticles = START_SLUGS.map(bySlug).filter((article): article is DocArticle => Boolean(article))
  const tutorial = bySlug(tutorialSlug)

  return (
    <div className="flex flex-col gap-8">
      <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-3 bg-canvas/95 px-4 py-2 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:items-center sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="relative flex min-w-0 flex-1 [&>div]:w-full">
          <SearchInput
            aria-label={t('hub.searchPlaceholder')}
            className="w-full"
            hotkey={SHORTCUTS.filter.key}
            onValueChange={setQuery}
            placeholder={t('hub.searchPlaceholder')}
            value={query}
          />
        </div>
        {canEdit && <CategoryManagerTrigger categories={categories} />}
      </div>

      {term ? (
        results.length === 0 ? (
          <Empty className="border py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LucideIcon name="search-x" />
              </EmptyMedia>
              <EmptyTitle>{tSearch('noResults')}</EmptyTitle>
              <EmptyDescription>{t('search.noMatches', { query: term })}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <section className="flex flex-col gap-2">
            <output className="type-caption text-fg-2">{t('search.results', { count: results.length })}</output>
            <div className="flex flex-col divide-y divide-border-subtle rounded-xl border border-border-subtle bg-card shadow-card">
              {results.map(result => (
                <Link
                  className="flex min-h-11 flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-surface-hover focus-visible:focus-ring-inset"
                  href={result.href}
                  key={result.articleId}
                >
                  <span className="type-label text-fg-1">{result.title}</span>
                  {result.excerpt && <span className="line-clamp-2 text-sm text-fg-2">{result.excerpt}</span>}
                  <span className="type-caption text-fg-3">{result.categoryTitle}</span>
                </Link>
              ))}
            </div>
          </section>
        )
      ) : (
        <>
          {startArticles.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="type-heading text-fg-title">{t('hub.startHere')}</h2>
              <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
                {startArticles.map(article => (
                  <Link
                    className="rounded-xl focus-visible:focus-ring"
                    href={`/docs/articles/${article.slug}`}
                    key={article.id}
                  >
                    <Card className="h-full gap-1.5 p-4 transition-colors hover:bg-surface-hover">
                      <span className="type-label text-fg-1">{pickLocale(article.title, locale) ?? article.slug}</span>
                      <span className="line-clamp-3 text-sm text-fg-2">{pickLocale(article.excerpt, locale)}</span>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {tutorial && (
            <Link
              className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border-subtle bg-card px-4 py-3 shadow-card transition-colors hover:bg-surface-hover focus-visible:focus-ring"
              href={`/docs/articles/${tutorial.slug}`}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="type-caption text-fg-2">{t('hub.forYourRole')}</span>
                <span className="type-label text-fg-1">{pickLocale(tutorial.title, locale) ?? tutorial.slug}</span>
              </span>
              <LucideIcon className="size-4 shrink-0 text-fg-2" name="arrow-right" />
            </Link>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {categories.map(category => (
              <TopicColumn allCategories={categories} canEdit={canEdit} category={category} key={category.id} />
            ))}
          </div>
        </>
      )}

      <Card className="gap-4 bg-surface-sunken p-6 shadow-none sm:flex-row sm:items-center sm:justify-between">
        <h2 className="type-heading text-fg-title">{tHelp('contact.title')}</h2>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild variant="brand">
            <a href={`mailto:${email}`}>
              <LucideIcon name="mail" />
              {tHelp('contact.emailLabel')}
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={website} rel="noopener noreferrer" target="_blank">
              {tHelp('contact.websiteLabel')}
              <LucideIcon name="arrow-up-right" />
            </a>
          </Button>
        </div>
      </Card>
    </div>
  )
}
