'use client'

import { CalendarIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useI18n } from '@/components/providers/i18n'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type DocArticle } from '@/db/queries/doc'
import { cn } from '@/lib/utils'

interface ArticleCardProps {
  article: DocArticle
  onClick: () => void
  className?: string
}

export const ArticleCard = ({ article, className, onClick }: ArticleCardProps) => {
  const t = useTranslations('Docs')
  const { locale, localize } = useI18n()

  const title = localize(article.title)
  const excerpt = article.excerpt ? localize(article.excerpt) : null
  const updatedAt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(article.updatedAt))

  return (
    <button className={cn('w-full cursor-pointer text-left', className)} type="button" onClick={onClick}>
      <Card className="h-full transition-shadow hover:shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-[15px] leading-snug">{title}</CardTitle>
            {article.isDraft && (
              <Badge className="shrink-0" size="sm" variant="muted">
                {t('draft')}
              </Badge>
            )}
          </div>
        </CardHeader>
        {(excerpt || updatedAt) && (
          <CardContent className="flex flex-col gap-2">
            {excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
              <CalendarIcon className="size-3 shrink-0" />
              <span>{t('lastUpdated', { date: updatedAt })}</span>
            </div>
          </CardContent>
        )}
      </Card>
    </button>
  )
}
