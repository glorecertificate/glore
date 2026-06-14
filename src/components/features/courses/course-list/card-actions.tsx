'use client'

import { type Route } from 'next'
import { useState } from 'react'

import { ArchiveIcon, ArchiveRestoreIcon, MoreHorizontalIcon, RocketIcon, SettingsIcon, Trash2Icon } from 'lucide-react'
import { type Locale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { deleteCourse as deleteCourseAction, updateCourse as updateCourseAction } from '@/actions/courses/management'
import { useCourses } from '@/components/features/courses/context'
import { CourseDialog } from '@/components/features/courses/course-dialog'
import { useI18n } from '@/components/providers/i18n'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link } from '@/components/ui/link'
import { type Course } from '@/db/queries/course'
import { cn } from '@/lib/utils'

export const CourseCardActions = ({
  actionLabel,
  course,
  coursePath,
}: {
  actionLabel: string
  course: Course
  coursePath: string
}) => {
  const archived = !!course.archivedAt
  const t = useTranslations('Courses')
  const { localeItems } = useI18n()
  const { setCourses } = useCourses()

  const [editOpen, setEditOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [publishTarget, setPublishTarget] = useState<{ locale: Locale; publish: boolean } | null>(null)
  const publishedSet = new Set((course.languages ?? []) as Locale[])

  const targetLabel = (() => {
    if (!publishTarget) return ''
    const item = localeItems.find(i => i.value === publishTarget.locale)
    return item ? item.displayLabel : publishTarget.locale
  })()

  const archiveCourse = async () => {
    setIsArchiving(true)
    try {
      const { data, error } = await updateCourseAction(course.id, { archivedAt: new Date().toISOString() })
      if (error || !data) throw error ?? new Error('Course not found')
      setArchiveDialogOpen(false)
      toast.success(t('courseArchived'))
      setCourses(prev => prev.map(c => (c.id === course.id ? data : c)))
    } catch (e) {
      console.error(e)
      setIsArchiving(false)
      toast.error(t('courseArchivedError'))
    }
  }

  const unarchiveCourse = async () => {
    setIsArchiving(true)
    try {
      const { data, error } = await updateCourseAction(course.id, { archivedAt: null })
      if (error || !data) throw error ?? new Error('Course not found')
      setArchiveDialogOpen(false)
      toast.success(t('courseUnarchived'))
      setCourses(prev => prev.map(c => (c.id === course.id ? data : c)))
    } catch (e) {
      console.error(e)
      setIsArchiving(false)
      toast.error(t('courseArchivedError'))
    }
  }

  const deleteCourse = async () => {
    setIsDeleting(true)
    try {
      const { error } = await deleteCourseAction(course.id)
      if (error) throw error
      setDeleteDialogOpen(false)
      toast.success(t('courseDeleted'))
      setCourses(prev => prev.filter(c => c.id !== course.id))
    } catch (e) {
      console.error(e)
      setIsDeleting(false)
      toast.error(t('courseDeletedError'))
    }
  }

  const togglePublish = async () => {
    if (!publishTarget) return
    const { locale, publish } = publishTarget
    const previous = (course.languages ?? []) as Locale[]
    const next = publish ? [...new Set([...previous, locale])] : previous.filter(lang => lang !== locale)

    setIsPublishing(true)
    setCourses(prev => prev.map(c => (c.id === course.id ? ({ ...c, languages: next } as Course) : c)))

    try {
      const { error } = await updateCourseAction(course.id, { languages: next })
      if (error) throw error
      const langLabel = localeItems.find(item => item.value === locale)
      const lang = langLabel ? langLabel.displayLabel : locale
      toast.success(publish ? t('coursePublishedIn', { lang }) : t('courseUnpublishedFrom', { lang }))
      setPublishTarget(null)
    } catch (e) {
      console.error(e)
      setCourses(prev => prev.map(c => (c.id === course.id ? ({ ...c, languages: previous } as Course) : c)))
      toast.error(publish ? t('coursePublishError') : t('courseUnpublishError'))
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <>
      <ButtonGroup className="w-full">
        {archived ? (
          <>
            <Button className="flex-1" onClick={() => setArchiveDialogOpen(true)} variant="outline">
              <ArchiveRestoreIcon />
              {t('unarchive')}
            </Button>
            <AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button size="icon" title={t('delete')} variant="outline">
                  <Trash2Icon className="text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('confirmDeleteMessage')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    loading={isDeleting}
                    onClick={e => {
                      e.preventDefault()
                      deleteCourse()
                    }}
                    variant="destructive"
                  >
                    {t('continue')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <>
            <Button asChild className="flex-1" variant="outline">
              <Link href={coursePath as Route}>{actionLabel}</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline">
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                    <SettingsIcon />
                    {t('settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <RocketIcon className="size-4 text-muted-foreground" />
                      {t('publishIn')}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {localeItems.map(item => {
                        const isPublished = publishedSet.has(item.value)
                        return (
                          <DropdownMenuItem
                            key={item.value}
                            onSelect={e => {
                              e.preventDefault()
                              setPublishTarget({ locale: item.value, publish: !isPublished })
                            }}
                          >
                            <span className="flex w-full items-center justify-between gap-2">
                              <span className="flex items-center gap-1">
                                {item.label} {item.icon}
                              </span>
                              <span
                                aria-hidden
                                className={cn(
                                  'relative inline-block size-1.5 rounded-full',
                                  isPublished ? 'bg-success' : 'bg-muted-foreground/40'
                                )}
                              >
                                {isPublished && (
                                  <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60" />
                                )}
                              </span>
                            </span>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <AlertDialog onOpenChange={setArchiveDialogOpen} open={archiveDialogOpen}>
                    <AlertDialogTrigger className="w-full">
                      <DropdownMenuItem onSelect={e => e.preventDefault()}>
                        <ArchiveIcon />
                        {t('archiveAction')}
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('confirmArchiveTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('confirmArchiveMessage')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isArchiving}>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          loading={isArchiving}
                          onClick={e => {
                            e.preventDefault()
                            archiveCourse()
                          }}
                          variant="warning"
                        >
                          {t('continue')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
                    <AlertDialogTrigger className="w-full">
                      <DropdownMenuItem onSelect={e => e.preventDefault()} variant="destructive">
                        <Trash2Icon />
                        {t('delete')}
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('confirmDeleteMessage')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          loading={isDeleting}
                          onClick={e => {
                            e.preventDefault()
                            deleteCourse()
                          }}
                          variant="destructive"
                        >
                          {t('continue')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </ButtonGroup>
      {archived && (
        <AlertDialog onOpenChange={setArchiveDialogOpen} open={archiveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('confirmUnarchiveTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('confirmUnarchiveMessage')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isArchiving}>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                loading={isArchiving}
                onClick={e => {
                  e.preventDefault()
                  unarchiveCourse()
                }}
                variant="brand"
              >
                {t('continue')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      <CourseDialog course={course} onOpenChange={setEditOpen} open={editOpen} />
      <AlertDialog onOpenChange={open => !open && setPublishTarget(null)} open={!!publishTarget}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {publishTarget?.publish
                ? t('publishInLanguage', { lang: targetLabel })
                : t('unpublishFromLanguage', { lang: targetLabel })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {publishTarget?.publish ? t('publishCourseMessage') : t('unpublishCourseMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPublishing}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              loading={isPublishing}
              onClick={e => {
                e.preventDefault()
                togglePublish()
              }}
              variant={publishTarget?.publish ? 'brand' : 'warning'}
            >
              {t('continue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
