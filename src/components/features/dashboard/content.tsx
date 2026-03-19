'use client'

import { useMemo } from 'react'

import { BookOpenIcon, GraduationCapIcon, LayersIcon, LibraryIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CourseAnalytics } from '@/components/features/dashboard/analytics'
import { PersonalProgress } from '@/components/features/dashboard/progress'
import { useCourses } from '@/components/providers/courses-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/hooks/use-i18n'
import { useSession } from '@/hooks/use-session'
import { cn } from '@/lib/utils'

export const DashboardContent = () => {
  const { organization, user } = useSession()
  const { courses, skillGroups } = useCourses()
  const { localize } = useI18n()
  const t = useTranslations('Dashboard')

  const hour = useMemo(() => new Date().getHours(), [])

  const greetingKey = useMemo(
    () => (hour < 12 ? 'greetingMorning' : hour < 18 ? 'greetingAfternoon' : 'greetingEvening'),
    [hour]
  )

  const subtitleKey = useMemo(() => {
    if (user.isAdmin) return 'subtitleAdmin'
    if (user.canEdit) return 'subtitleEditor'
    if (user.isOrgAdmin) return 'subtitleOrgAdmin'
    if (user.isRepresentative) return 'subtitleRepresentative'
    if (user.isTutor) return 'subtitleTutor'
    if (user.isVolunteer) return 'subtitleVolunteer'
    return 'subtitleLearner'
  }, [user.canEdit, user.isAdmin, user.isOrgAdmin, user.isRepresentative, user.isTutor, user.isVolunteer])

  const publishedCourses = useMemo(() => courses.filter(c => c.publicationStatus === 'published'), [courses])

  const totalLessons = useMemo(() => publishedCourses.reduce((sum, c) => sum + c.lessons.length, 0), [publishedCourses])

  const nonArchivedCount = useMemo(() => courses.filter(c => c.publicationStatus !== 'archived').length, [courses])

  const stats = useMemo(
    () => [
      { icon: BookOpenIcon, key: 'publishedCourses', label: t('publishedCourses'), value: publishedCourses.length },
      { icon: GraduationCapIcon, key: 'totalLessons', label: t('totalLessons'), value: totalLessons },
      { icon: LayersIcon, key: 'skillGroups', label: t('skillGroups'), value: skillGroups.length },
      { icon: LibraryIcon, key: 'allCourses', label: t('allCourses'), value: nonArchivedCount },
    ],
    [nonArchivedCount, publishedCourses.length, skillGroups.length, t, totalLessons]
  )

  const courseTypes = useMemo(
    () => [
      {
        cardClass: 'border-info/30 bg-info/5',
        countClass: 'text-info',
        courses: publishedCourses.filter(c => c.type === 'intro'),
        key: 'intro',
        label: t('introductoryCourses'),
      },
      {
        cardClass: 'border-brand/30 bg-brand/5',
        countClass: 'text-brand',
        courses: publishedCourses.filter(c => c.type === 'skill'),
        key: 'skill',
        label: t('skillCourses'),
      },
      {
        cardClass: 'border-success/30 bg-success/5',
        countClass: 'text-success',
        courses: publishedCourses.filter(c => c.type === 'learner'),
        key: 'learner',
        label: t('learnerCourses'),
      },
    ],
    [publishedCourses, t]
  )

  return (
    <div className="flex flex-col gap-8 pt-6 pb-10">
      <section className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{t(greetingKey, { name: user.firstName })}</h1>
        <p className="text-[15px] text-muted-foreground">
          {t(subtitleKey)}
          {organization && (
            <span className="text-foreground/60 before:mx-1.5 before:content-['·']">{organization.name}</span>
          )}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ icon: Icon, key, label, value }) => (
          <Card key={key}>
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium">{label}</CardDescription>
                <Icon className="size-3.5 text-muted-foreground/60" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pt-0 pb-4">
              <p className="text-3xl font-bold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {publishedCourses.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground">{t('coursesByType')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {courseTypes.map(({ cardClass, countClass, courses: typeCourses, key, label }) => (
              <Card key={key} className={cn(cardClass)}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-medium">{label}</CardTitle>
                    <span className={cn('text-2xl font-bold tabular-nums', countClass)}>{typeCourses.length}</span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pt-0 pb-4">
                  {typeCourses.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60">{t('noCoursesMessage')}</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {typeCourses.slice(0, 3).map(course => (
                        <li key={course.id} className="truncate text-xs text-muted-foreground">
                          {localize(course.title)}
                        </li>
                      ))}
                      {typeCourses.length > 3 && (
                        <li className="text-xs text-muted-foreground/50">
                          +{typeCourses.length - 3} {t('moreCourses')}
                        </li>
                      )}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {user.canEdit ? <CourseAnalytics /> : <PersonalProgress />}
    </div>
  )
}
