'use client'

import { useTranslations } from 'next-intl'

import { CourseContent } from '@/components/features/courses/course-editor/content'
import { useCourse } from '@/components/features/courses/course-editor/context'
import { CourseFooter } from '@/components/features/courses/course-editor/footer'
import { CourseLanguageTabs } from '@/components/features/courses/course-editor/language-tabs'
import { CourseLessonPicker } from '@/components/features/courses/course-editor/lesson-picker'
import { CourseSidebar } from '@/components/features/courses/course-editor/sidebar'
import { CourseTranslation } from '@/components/features/courses/course-editor/translation'
import { useI18n } from '@/components/providers/i18n'
import { useMetadata } from '@/hooks/use-metadata'
import { useNavigationGuard } from '@/hooks/use-navigation-guard'

const COURSE_SIDEBAR_WIDTH = '18rem'
const sidebarStyle = { width: COURSE_SIDEBAR_WIDTH }

export const CourseEditor = () => {
  const { course, hasAnyUpdates, language } = useCourse()
  const t = useTranslations('CourseEditor')
  const { localeItems } = useI18n()
  const hasFooter = course.lessons && course.lessons.length > 1
  const languageLabel = localeItems.find(item => item.value === language)?.displayLabel ?? language

  useMetadata({ title: course.title[language] })

  useNavigationGuard(hasAnyUpdates)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 pb-24 md:pb-0 xl:flex-row">
        <CourseSidebar className="hidden shrink-0 xl:block" style={sidebarStyle} />
        <div className="flex min-w-0 grow flex-col">
          <CourseLessonPicker className="mb-4 xl:hidden" />
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <CourseLanguageTabs />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('editingLanguage', { language: languageLabel })}</span>
              <CourseTranslation />
            </div>
          </div>
          <CourseContent />
          {hasFooter && <CourseFooter />}
        </div>
      </div>
    </div>
  )
}
