'use client'

import type React from 'react'
import { startTransition, useCallback, useMemo } from 'react'

import { GripVerticalIcon } from 'lucide-react'
import { type Locale } from 'next-intl'
import { toast } from 'sonner'

import { deleteCourse, reorderCourses, updateCourse } from '@/actions/course'
import { CourseCard } from '@/components/features/courses/course-list/course-list-card'
import { useCourseList } from '@/components/features/courses/course-list/course-list-context'
import { Image } from '@/components/ui/image'
import { Sortable, SortableContent, SortableItem, SortableItemHandle } from '@/components/ui/sortable'
import { TabsContent } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type Course } from '@/db/queries/course'
import { useCookies } from '@/hooks/use-cookies'
import { useI18n } from '@/hooks/use-i18n'
import { i18n } from '@/lib/i18n'
import { publicFile } from '@/lib/storage'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

export const CourseListContent = ({ className, ...props }: Omit<React.ComponentProps<typeof TabsContent>, 'value'>) => {
  const { locale, localeItems } = useI18n()
  const cookies = useCookies()
  const { activeSkillGroups, activeLanguages, courses, skillGroups, sort, t, tab, user } = useCourseList()
  const hasFilters = activeLanguages.length !== i18n.locales.length

  const emptyTitle = useMemo(() => {
    switch (tab) {
      case 'published':
        return t('emptyTitlePublished')
      case 'draft':
        return t('emptyTitleDraft')
      case 'archived':
        return t('emptyTitleArchived')
      default:
        return hasFilters ? t('emptyTitleCommon') : t('emptyTitle')
    }
  }, [tab, hasFilters, t])

  const formatEmptyMessage = useCallback(
    (message: string) => (hasFilters ? t.markup('withFilters', { message }) : t('atTheMoment', { message })),
    [hasFilters, t]
  )

  const emptyMessage = useMemo(() => {
    switch (tab) {
      case 'published':
        return formatEmptyMessage(t('emptyMessagePublished'))
      case 'draft':
        return formatEmptyMessage(t('emptyMessageDraft'))
      case 'archived':
        return formatEmptyMessage(t('emptyMessageArchived'))
      case 'not_started':
        return t('emptyMessageNotStarted')
      case 'in_progress':
        return t('emptyMessageInProgress')
      case 'completed':
        return t('emptyMessageCompleted')
      default:
        return t('emptyMessage')
    }
  }, [tab, formatEmptyMessage, t])

  const setOrder = useCallback(
    (orderedCourses: (Course & { language: Locale })[]) => {
      const start = (currentPage - 1) * COURSE_LIST_ITEMS_PER_PAGE
      const reorderedSlice = orderedCourses.map((course, index) => ({
        ...course,
        sort_order: start + index + 1,
      }))

      startTransition(() => {
        const newCourses = [...courses]
        newCourses.splice(start, orderedCourses.length, ...reorderedSlice)
        setCourses(newCourses)
        reorderCourses(reorderedSlice)
      })
    },
    [courses]
  )

  const setLanguagesCookie = useCallback(
    (slug: string, value: Locale) => {
      const languageCookie = cookies.get('courseLanguages')
      if (languageCookie) {
        languageCookie[slug] = value
        cookies.set('courseLanguages', languageCookie)
      }
    },
    [cookies.get, cookies.set]
  )

  const archiveCourse = async (id: number) => {
    try {
      await updateCourse(id, { archived_at: new Date().toISOString() })
      toast.success(t('courseArchived'))
    } catch (e) {
      console.error(e)
      toast.error(t('courseArchivedError'))
    }
  }

  const unarchiveCourse = async (id: number) => {
    try {
      await updateCourse(id, { archived_at: null })
      toast.success(t('courseUnarchived'))
    } catch (e) {
      console.error(e)
      toast.error(t('courseArchivedError'))
    }
  }

  const removeCourse = async (id: number) => {
    try {
      await deleteCourse(id)
      toast.success(t('courseDeleted'))
    } catch (e) {
      console.error(e)
      toast.error(t('courseDeletedError'))
    }
  }

  const updateIcon = (id: number, icon: IconName) => {
    try {
      startTransition(() => {
        setCourses(prev => prev.map(course => (course.id === id ? { ...course, icon } : course)))
        updateCourse(id, { icon })
      })
    } catch (e) {
      console.error(e)
    }
  }

  if (courses.length === 0) {
    return (
      <TabsContent className={cn('grow space-y-4', className)} value={tab} {...props}>
        <div className="flex h-full flex-col items-center justify-center gap-8 pb-8 text-center">
          <Image className="w-58" src={publicFile('assets/no-results.svg')} />
          <div className="flex flex-col items-center gap-1">
            <h3 className="font-medium text-xl">{emptyTitle}</h3>
            <p className="mt-1 text-muted-foreground">
              {`${emptyMessage}.`}
              {hasFilters && (
                <>
                  <br />
                  {`${t('updateFilters')}.`}
                </>
              )}
            </p>
          </div>
        </div>
      </TabsContent>
    )
  }

  const isSortable = tab === 'all' && sort === 'default' && activeSkillGroups.length === groups.length

  return (
    <TabsContent className={cn('grow space-y-4', className)} value={tab} {...props}>
      {isSortable ? (
        <Sortable getItemValue={item => item.id} onValueChange={setOrder} orientation="mixed" value={paginatedCourses}>
          <SortableContent asChild>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {paginatedCourses.map(course => (
                <SortableItem className="group/sortable-item relative h-full" key={course.slug} value={course.id}>
                  <CourseCard
                    className="h-full"
                    course={course}
                    editable={user.canEdit}
                    key={course.slug}
                    languages={activeLanguages}
                    locale={locale}
                    localeItems={localeItems}
                    onArchive={() => archiveCourse(course.id)}
                    onDelete={() => removeCourse(course.id)}
                    onIconChange={icon => updateIcon(course.id, icon)}
                    onLanguageChange={value => setLanguagesCookie(course.slug, value)}
                    onUnarchive={() => unarchiveCourse(course.id)}
                    translator={t}
                  />
                  <SortableItemHandle
                    className="absolute top-6 right-6 opacity-0 transition-opacity group-hover/sortable-item:opacity-100"
                    title={t('reorderCourse')}
                  >
                    <GripVerticalIcon className="size-4 text-muted-foreground" />
                  </SortableItemHandle>
                </SortableItem>
              ))}
            </div>
          </SortableContent>
        </Sortable>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {paginatedCourses.map(course => (
            <div className="group/sortable-item relative h-full" key={course.slug}>
              <CourseCard
                className="h-full"
                course={course}
                editable={user.canEdit}
                key={course.slug}
                languages={activeLanguages}
                locale={locale}
                localeItems={localeItems}
                onArchive={() => archiveCourse(course.id)}
                onDelete={() => removeCourse(course.id)}
                onIconChange={icon => updateIcon(course.id, icon)}
                onLanguageChange={value => setLanguagesCookie(course.slug, value)}
                onUnarchive={() => unarchiveCourse(course.id)}
                translator={t}
              />
              {tab === 'all' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="absolute top-6 right-6 flex cursor-not-allowed items-center justify-center rounded-md p-1 opacity-0 transition-opacity hover:bg-muted group-hover/sortable-item:opacity-50"
                      disabled
                      type="button"
                    >
                      <GripVerticalIcon className="size-4 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="w-fit max-w-50 rounded-lg px-0 text-center" sideOffset={10}>
                    {t('reorderDisabled')}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          ))}
        </div>
      )}
    </TabsContent>
  )
}
