import { useTranslations } from 'next-intl'

import { StartCourseDialog } from '@/components/features/courses/course-overview/start-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { type CourseOverview } from '@/db/queries/learning'

export const CourseStartPrompt = ({ overview }: { overview: CourseOverview }) => {
  const t = useTranslations('Learning.overview')
  const { id, language, lessons, slug, title } = overview

  return (
    <Card className="gap-4 p-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="type-heading">{t('startPrompt.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('startPrompt.description')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <StartCourseDialog
          courseId={id}
          defaultOpen
          language={language}
          lessonCount={lessons.length}
          lessonId={lessons[0]?.id ?? null}
          title={title}
        >
          <Button variant="brand">{t('start')}</Button>
        </StartCourseDialog>
        <Button asChild variant="outline">
          <Link href={`/courses/${slug}?lang=${language}`}>{t('startPrompt.back')}</Link>
        </Button>
      </div>
    </Card>
  )
}
