'use client'

import { useTranslations } from 'next-intl'

import { useHelpRole } from '@/components/features/help/use-help-role'
import { useI18n } from '@/components/providers/i18n'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { DOC_AUDIENCES, type DocArticle } from '@/db/queries/doc'
import { pickLocale } from '@/db/queries/learning'
import { cn } from '@/lib/utils'

interface ArticleCardProps {
  article: DocArticle
  className?: string
}

export const ArticleCard = ({ article, className }: ArticleCardProps) => {
  const t = useTranslations('Docs')
  const tRoles = useTranslations('Help.roles')
  const { locale } = useI18n()
  const role = useHelpRole()
  const audiences = role === 'team' ? DOC_AUDIENCES.filter(audience => article.audiences.includes(audience)) : []

  const title = pickLocale(article.title, locale) ?? article.slug
  const excerpt = pickLocale(article.excerpt, locale)

  return (
    <Link
      className={cn('block w-full rounded-xl text-left focus-visible:focus-ring', className)}
      href={`/docs/articles/${article.slug}`}
    >
      <Card className="h-full transition-colors hover:bg-surface-hover">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="type-heading text-fg-1">{title}</CardTitle>
            {article.isDraft && (
              <Badge className="shrink-0" size="sm" variant="outline">
                {t('draft')}
              </Badge>
            )}
          </div>
          {audiences.length > 0 && (
            <ul aria-label={t('audience.label')} className="flex flex-wrap gap-1">
              {audiences.map(audience => (
                <li key={audience}>
                  <Badge size="sm" variant="outline">
                    {tRoles(`${audience}.label`)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardHeader>
        {excerpt && (
          <CardContent>
            <p className="line-clamp-2 text-sm text-fg-2">{excerpt}</p>
          </CardContent>
        )}
      </Card>
    </Link>
  )
}
