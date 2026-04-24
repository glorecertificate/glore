'use client'

import { useCallback, useMemo, useRef, useState } from 'react'

import { type Locale, useTranslations } from 'next-intl'
import { useFormGuard } from 'use-form-guard'

import { CourseContent } from '@/components/features/courses/editor/content'
import { useCourse } from '@/components/features/courses/editor/context'
import { CourseFooter } from '@/components/features/courses/editor/footer'
import { CourseHeader, CourseHeaderMobile } from '@/components/features/courses/editor/header'
import { CourseSidebar } from '@/components/features/courses/editor/sidebar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs } from '@/components/ui/tabs'
import { useI18n } from '@/hooks/use-i18n'
import { useMetadata } from '@/hooks/use-metadata'

const COURSE_SIDEBAR_WIDTH = '18rem'
const sidebarStyle = { width: COURSE_SIDEBAR_WIDTH }

export const CourseView = () => {
  const { course, hasAnyUpdates, language, setLanguage, status } = useCourse()
  const { localeItems } = useI18n()
  const t = useTranslations('Courses')
  const hasFooter = course.lessons && course.lessons.length > 1

  useMetadata({
    title: course.title[language],
  })

  const [guardOpen, setGuardOpen] = useState(false)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const unsavedLanguages = useMemo(
    () => localeItems.filter(({ value }) => status[value as Locale].hasUpdates).map(({ label }) => label),
    [localeItems, status]
  )

  const handleBlock = useCallback(
    () =>
      new Promise<boolean>(resolve => {
        resolverRef.current = resolve
        setGuardOpen(true)
      }),
    []
  )

  useFormGuard({
    isDirty: hasAnyUpdates,
    onBlock: handleBlock,
  })

  const handleConfirm = useCallback(() => {
    resolverRef.current?.(true)
    resolverRef.current = null
    setGuardOpen(false)
  }, [])

  const handleCancel = useCallback(() => {
    resolverRef.current?.(false)
    resolverRef.current = null
    setGuardOpen(false)
  }, [])

  return (
    <Tabs className="pt-2" onValueChange={value => setLanguage(value as Locale)} value={language}>
      <CourseHeader />
      <div className="flex flex-col gap-2 pb-8 md:flex-row">
        <CourseSidebar className="hidden md:block" style={sidebarStyle} />
        <div className="flex grow flex-col">
          <CourseHeaderMobile className="sticky top-18 md:hidden" />
          <CourseContent />
          {hasFooter && <CourseFooter />}
        </div>
      </div>
      <AlertDialog onOpenChange={open => !open && handleCancel()} open={guardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('unsavedChangesTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('unsavedChangesMessage', { languages: unsavedLanguages.join(', ') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel} variant="outline">
              {t('stayOnPage')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} variant="destructive">
              {t('leavePage')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  )
}
