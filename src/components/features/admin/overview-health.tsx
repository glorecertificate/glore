import { useTranslations } from 'next-intl'

import { type ContentHealth } from '@/actions/dashboard/core'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { SkeletonText } from '@/components/ui/skeleton'

const ROWS = 4

export const AdminOverviewHealth = ({ health }: { health: ContentHealth | null }) => {
  const t = useTranslations('Dashboard.editor')
  const rows = health?.attention.slice(0, ROWS) ?? []

  return (
    <Card className="gap-0 p-0" data-slot="admin-health">
      <CardHeader className="p-5">
        <CardTitle>{t('healthTitle')}</CardTitle>
        <CardAction>
          <Link className="inline-flex min-h-8 items-center text-sm font-medium" href="/courses" variant="primary">
            {t('openCourses')}
          </Link>
        </CardAction>
      </CardHeader>
      {!health && (
        <div className="border-t border-border-subtle px-5 py-4 text-sm">
          <SkeletonText>{t('healthClear')}</SkeletonText>
        </div>
      )}
      {health && rows.length === 0 && (
        <p className="border-t border-border-subtle px-5 py-6 text-sm text-muted-foreground">{t('healthClear')}</p>
      )}
      {rows.length > 0 && (
        <ul className="divide-y divide-border-subtle border-t border-border-subtle">
          {rows.map(course => (
            <li
              className="grid gap-x-4 gap-y-1.5 px-5 py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)] sm:items-center"
              key={course.slug}
            >
              <Link className="truncate text-sm font-medium" href={`/courses/${course.slug}`}>
                {course.title}
              </Link>
              <div className="flex flex-wrap gap-1.5">
                {course.issues.slice(0, 1).map(issue => (
                  <Badge key={issue} variant="warning">
                    {t(`issue.${issue}`)}
                  </Badge>
                ))}
              </div>
              <p className="type-caption text-fg-2">
                {course.missing.length > 0 &&
                  t('missing', { language: course.missing.map(locale => locale.toUpperCase()).join(', ') })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
