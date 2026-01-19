'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ArchiveIcon, CircleFadingPlusIcon, GripVerticalIcon, PlusIcon } from 'lucide-react'
import { type Locale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { type CamelCase } from 'type-fest'
import { type z } from 'zod'

import { setCookie } from '@/actions/cookies'
import { reorderCourses } from '@/actions/course'
import { CourseCard } from '@/components/features/courses/course-card'
import {
  CourseListSort,
  type CourseListSortDirection,
  type CourseListSortType,
} from '@/components/features/courses/course-list-sort'
import { CourseSettings, type courseSettingsSchema } from '@/components/features/courses/course-settings'
import { NoResultsGraphic } from '@/components/icons/_no-results-graphic'
import { useSession } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  MultiSelect,
  MultiSelectBadge,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
} from '@/components/ui/multi-select'
import { Sortable, SortableContent, SortableItem, SortableItemHandle } from '@/components/ui/sortable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type Course } from '@/db/schema/courses'
import { type TableInsert } from '@/db/types'
import { postgrestError } from '@/db/utils'
import { useI18n } from '@/hooks/use-i18n'
import { i18n } from '@/lib/i18n'
import { type Enum } from '@/lib/types'
import { camelize, pluck } from '@/lib/utils'

export enum CourseListEditorView {
  All = 'all',
  Published = 'published',
  Partial = 'partial',
  Draft = 'draft',
  Archived = 'archived',
}

export enum CourseListLearnerView {
  All = 'all',
  NotStarted = 'not_started',
  InProgress = 'in_progress',
  Completed = 'completed',
}

export type CourseListView = Enum<CourseListEditorView | CourseListLearnerView>

const CourseListTab = ({ count, value }: { active: boolean; count: number; value: CourseListView }) => {
  const t = useTranslations('Courses')

  const archiveTooltip = useMemo(() => {
    if (value !== 'archived') return null
    if (count === 0) return t('archive')
    return (
      <span className="flex items-center gap-1">
        {t('archive')}
        <small className="text-background/70 leading-0">{count}</small>
      </span>
    )
  }, [count, t, value])

  if (value === 'archived')
    return (
      <TabsTrigger className="rounded-xl p-0" effect="text-stroke" value={value}>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <span className="inline-block px-3.5">
              <ArchiveIcon />
            </span>
          </TooltipTrigger>
          <TooltipContent sideOffset={12}>{archiveTooltip}</TooltipContent>
        </Tooltip>
      </TabsTrigger>
    )

  return (
    <TabsTrigger className="rounded-xl" count={count} effect="text-stroke" value={value}>
      {t(value)}
    </TabsTrigger>
  )
}

export const CourseList = ({
  defaultCourseLanguage,
  defaultGroups,
  defaultLanguages,
  defaultTab = 'all',
}: {
  defaultCourseLanguage?: Record<string, Locale>
  defaultLanguages?: Locale[]
  defaultGroups?: string[]
  defaultTab?: CourseListView
}) => {
  const router = useRouter()
  const { locale, localeItems, localize } = useI18n()
  const t = useTranslations('Courses')

  const { user, courses: sessionCourses, setCourses, addCourse, skillGroups } = useSession()

  const groups = skillGroups.map(group => ({
    label: localize(group.name),
    value: String(group.id),
  }))
  const groupOptions = pluck(groups, 'value')

  const [activeTab, setActiveTab] = useState<CourseListView>(defaultTab)
  const [activeSort, setActiveSort] = useState<CourseListSortType | null>(null)
  const [activeGroups, setActiveGroups] = useState(defaultGroups ?? [...groupOptions])
  const [activeLanguages, setActiveLanguages] = useState<Locale[]>(defaultLanguages ?? [...i18n.locales])
  const [sortDirection, setSortDirection] = useState<CourseListSortDirection | null>(null)

  const activeGroupItems = groups.filter(group => activeGroups.includes(group.value))
  const activeLanguageItems = localeItems.filter(item => activeLanguages.includes(item.value))
  const hasFilters = activeLanguages.length !== i18n.locales.length

  const tabs = user.canEdit
    ? activeLanguages.length > 1
      ? [...Object.values(CourseListEditorView)]
      : Object.values(CourseListEditorView).filter(tab => tab !== CourseListEditorView.Partial)
    : [...Object.values(CourseListLearnerView)]

  const courses = useMemo<Record<CamelCase<CourseListView>, Course[]>>(() => {
    const all = sessionCourses.filter(course => !course.archived_at)

    if (user.canEdit)
      return {
        all,
        published: all.filter(course => activeLanguages.every(lang => course.languages?.includes(lang))),
        partial: all.filter(course => {
          const published = activeLanguages.filter(lang => course.languages?.includes(lang))
          return published.length > 0 && published.length < activeLanguages.length
        }),
        draft: all.filter(course => activeLanguages.every(lang => !course.languages?.includes(lang))),
        archived: sessionCourses.filter(course => course.archived_at),
        notStarted: [],
        inProgress: [],
        completed: [],
      }

    return {
      all,
      published: [],
      partial: [],
      draft: [],
      archived: sessionCourses.filter(course => course.archived_at),
      notStarted: all.filter(course => course.progressStatus === 'not_started'),
      inProgress: all.filter(course => course.progressStatus === 'in_progress'),
      completed: all.filter(course => course.progressStatus === 'completed'),
    }
  }, [sessionCourses, user.canEdit, activeLanguages])

  const visibleCourses = useMemo(
    () =>
      courses[camelize(activeTab)]
        .map(course => {
          const cookieLanguage = defaultCourseLanguage?.[String(course.id)]
          if (cookieLanguage && activeLanguages.includes(cookieLanguage)) return { ...course, language: cookieLanguage }
          const lang = course.languages?.includes(locale) ? locale : course.languages?.[0]
          return { ...course, language: lang }
        })
        .sort((a, b) => {
          switch (activeSort) {
            case 'name': {
              const titleA = localize(a.title)
              const titleB = localize(b.title)
              if (!(titleA && titleB)) return 0
              return sortDirection === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA)
            }
            case 'progress': {
              if (a.progress == null || b.progress == null) return 0
              return sortDirection === 'asc' ? a.progress - b.progress : b.progress - a.progress
            }
            case 'skillGroup': {
              if (!(a.skillGroup?.name && b.skillGroup?.name)) return 0
              const skillA = localize(a.skillGroup.name)
              const skillB = localize(b.skillGroup.name)
              if (!(skillA && skillB)) return 0
              return sortDirection === 'asc' ? skillA.localeCompare(skillB) : skillB.localeCompare(skillA)
            }
            case 'creationDate': {
              if (!(a.created_at && b.created_at)) return 0
              return sortDirection === 'asc'
                ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            }
            case 'lastUpdated': {
              if (!(a.updated_at && b.updated_at)) return 0
              return sortDirection === 'asc'
                ? new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
                : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            }
            case 'type': {
              if (!(a.type && b.type)) return 0
              return sortDirection === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type)
            }
            default:
              if (a.sort_order == null || b.sort_order == null) return 0
              return a.sort_order - b.sort_order
          }
        }),
    [activeLanguages, activeSort, activeTab, courses, defaultCourseLanguage, locale, localize, sortDirection]
  )

  const emptyTitle = useMemo(() => {
    switch (activeTab) {
      case 'published':
        return t('emptyTitlePublished')
      case 'draft':
        return t('emptyTitleDraft')
      case 'archived':
        return t('emptyTitleArchived')
      default:
        return hasFilters ? t('emptyTitleCommon') : t('emptyTitle')
    }
  }, [activeTab, hasFilters, t])

  const formatEmptyMessage = useCallback(
    (message: string) => (hasFilters ? t.markup('withFilters', { message }) : t('atTheMoment', { message })),
    [hasFilters, t]
  )

  const emptyMessage = useMemo(() => {
    switch (activeTab) {
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
  }, [activeTab, formatEmptyMessage, t])

  const onLanguagesChange = useCallback(
    async (selected: string[]) => {
      const languages = selected as Locale[]
      setActiveLanguages(languages)
      if (activeTab === 'partial' && (languages.length === 1 || courses.partial.length === 0)) {
        setActiveTab('all')
      }
      await setCookie('courseListLanguage', languages)
    },
    [activeTab, courses.partial.length]
  )

  const onGroupChange = useCallback(async (selected: string[]) => {
    setActiveGroups(selected)
    await setCookie('courseListGroups', selected)
  }, [])

  const setOrder = useCallback(
    async (orderedCourses: Course[]) => {
      const nextOrders = new Map(orderedCourses.map((course, index) => [course.id, index + 1]))

      setCourses(prev => {
        const reordered = orderedCourses.map(course => {
          const previousCourse = new Map(prev.map(course => [course.id, course])).get(course.id)
          const sort_order = nextOrders.get(course.id)

          if (!previousCourse) {
            const { language: _language, ...rest } = course as Course & { language?: Locale }
            return sort_order ? { ...rest, sort_order } : rest
          }

          if (!sort_order || previousCourse.sort_order === sort_order) return previousCourse
          return { ...previousCourse, sort_order }
        })

        const untouched = prev.filter(course => !nextOrders.has(course.id))
        return [...reordered, ...untouched]
      })

      await reorderCourses(orderedCourses)
    },
    [setCourses]
  )

  const createCourse = useMemo(
    () => async (schema: z.infer<typeof courseSettingsSchema>) => {
      try {
        const course = await addCourse(schema as TableInsert<'courses'>)
        toast.success(t('courseCreated'), { duration: 4000 })
        router.push(`/courses/${course.slug}`)
      } catch (e) {
        const error = postgrestError(e)
        console.error(error.message, error)
        toast.error(error.code === '23505' ? t('courseSlugTaken') : t('courseCreationFailed'))
      }
    },
    [addCourse, t, router.push]
  )

  return (
    <Tabs
      className="h-full gap-6 pt-1 pb-5"
      defaultValue="all"
      onValueChange={value => setActiveTab(value as CourseListView)}
      value={activeTab}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <TabsList className="h-9.5 w-full rounded-xl sm:w-fit">
              {tabs.map(tab => (
                <CourseListTab active={tab === activeTab} count={courses[camelize(tab)].length} key={tab} value={tab} />
              ))}
            </TabsList>
            {user.canEdit && (
              <Dialog>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button
                        className="size-8 rounded-full text-[13px] hover:scale-105 focus:scale-105"
                        size="icon"
                        variant="brand"
                      >
                        <PlusIcon className="size-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>{t('createCourse')}</TooltipContent>
                </Tooltip>
                <DialogContent className="gap-6 p-8" size="lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CircleFadingPlusIcon className="size-5" />
                      {t('newCourse')}
                    </DialogTitle>
                    <DialogDescription>{t('newCourseDescription')}</DialogDescription>
                  </DialogHeader>
                  <CourseSettings onSubmit={createCourse} />
                </DialogContent>
              </Dialog>
            )}
          </div>
          <CourseListSort
            direction={sortDirection}
            setDirection={setSortDirection}
            setValue={setActiveSort}
            tab={activeTab}
            value={activeSort}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <MultiSelect label={t('skillGroup')} onChange={onGroupChange} options={groupOptions} value={activeGroups}>
            <MultiSelectTrigger>
              {activeGroupItems.map(item => (
                <MultiSelectBadge
                  className="py-1 font-medium text-xs"
                  key={item.value}
                  label={t('skillGroup').toLowerCase()}
                  value={item.value}
                >
                  {item.label}
                </MultiSelectBadge>
              ))}
            </MultiSelectTrigger>
            <MultiSelectContent align="start">
              {groups.map(item => (
                <MultiSelectItem key={item.value} {...item} />
              ))}
            </MultiSelectContent>
          </MultiSelect>
          <MultiSelect
            label={t('language')}
            onChange={onLanguagesChange}
            options={i18n.locales}
            value={activeLanguages}
          >
            <MultiSelectTrigger>
              {activeLanguageItems.map(({ displayLabel, icon, label, ...item }) => (
                <MultiSelectBadge className="gap-0 py-0 text-sm" key={item.value} label={displayLabel} {...item}>
                  {icon && <span className="mr-1 inline-block">{icon}</span>}
                </MultiSelectBadge>
              ))}
            </MultiSelectTrigger>
            <MultiSelectContent align="end">
              {localeItems.map(({ label, icon, value }) => (
                <MultiSelectItem key={value} value={value}>
                  {label} {icon}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
        </div>
      </div>
      <TabsContent className="grow space-y-4" value={activeTab}>
        {visibleCourses.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-8 pb-8 text-center">
            <NoResultsGraphic className="w-64" />
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
        ) : user.canEdit ? (
          <Sortable getItemValue={item => item.id} onValueChange={setOrder} orientation="mixed" value={visibleCourses}>
            <SortableContent className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visibleCourses.map(course => (
                <SortableItem className="group/sortable-item relative" key={course.slug} value={course.id}>
                  <CourseCard
                    activeLanguages={activeLanguages}
                    course={course}
                    key={course.slug}
                    showState={activeTab !== 'archived'}
                  />
                  {activeTab === 'all' &&
                    (activeSort === null && activeGroups.length === groups.length ? (
                      <SortableItemHandle
                        className="absolute top-6 right-6 opacity-0 transition-opacity group-hover/sortable-item:opacity-100"
                        title={t('reorderCourse')}
                      >
                        <GripVerticalIcon className="size-4 text-muted-foreground" />
                      </SortableItemHandle>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SortableItemHandle
                            className="absolute top-6 right-6 opacity-0 transition-opacity group-hover/sortable-item:opacity-50"
                            disabled
                          >
                            <GripVerticalIcon className="size-4 text-muted-foreground" />
                          </SortableItemHandle>
                        </TooltipTrigger>
                        <TooltipContent className="w-fit max-w-50 rounded-lg px-0 text-center" sideOffset={10}>
                          {t('reorderDisabled')}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                </SortableItem>
              ))}
            </SortableContent>
          </Sortable>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visibleCourses.map(course => (
              <CourseCard
                activeLanguages={activeLanguages}
                course={course}
                key={course.slug}
                showState={activeTab !== 'archived'}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
