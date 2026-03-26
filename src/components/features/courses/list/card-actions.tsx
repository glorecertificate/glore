'use client'

import { memo, useCallback, useState } from 'react'

import { ArchiveIcon, MoreHorizontalIcon, RocketIcon, Trash2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { deleteCourse as deleteCourseAction, updateCourse as updateCourseAction } from '@/actions/courses/management'
import { useCourses } from '@/components/providers/courses-context'
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
import { type Course } from '@/db/queries/course'
import { useI18n } from '@/hooks/use-i18n'

export const CourseCardActions = memo(({ course, onRemove }: { course: Course; onRemove: () => void }) => {
  const t = useTranslations('Courses')
  const { localeItems } = useI18n()
  const { setCourses } = useCourses()

  const [isDeleting, setIsDeleting] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)

  const archiveCourse = useCallback(async () => {
    setIsArchiving(true)
    try {
      const { error } = await updateCourseAction(course.id, { archivedAt: new Date().toISOString() })
      if (error) throw error
      setArchiveDialogOpen(false)
      toast.success(t('courseArchived'))
      onRemove()
      setTimeout(
        () =>
          setCourses(prev =>
            prev.map(c => (c.id === course.id ? ({ ...c, archivedAt: new Date().toISOString() } as Course) : c))
          ),
        200
      )
    } catch (e) {
      console.error(e)
      setIsArchiving(false)
      toast.error(t('courseArchivedError'))
    }
  }, [course.id, onRemove, setCourses, t])

  const unarchiveCourse = useCallback(async () => {
    setIsArchiving(true)
    try {
      const { error } = await updateCourseAction(course.id, { archivedAt: null })
      if (error) throw error
      setArchiveDialogOpen(false)
      toast.success(t('courseUnarchived'))
      onRemove()
      setTimeout(
        () => setCourses(prev => prev.map(c => (c.id === course.id ? ({ ...c, archivedAt: null } as Course) : c))),
        200
      )
    } catch (e) {
      console.error(e)
      setIsArchiving(false)
      toast.error(t('courseArchivedError'))
    }
  }, [course.id, onRemove, setCourses, t])

  const deleteCourse = useCallback(async () => {
    setIsDeleting(true)
    try {
      const { error } = await deleteCourseAction(course.id)
      if (error) throw error
      setDeleteDialogOpen(false)
      toast.success(t('courseDeleted'))
      onRemove()
      setTimeout(() => setCourses(prev => prev.filter(c => c.id !== course.id)), 200)
    } catch (e) {
      console.error(e)
      setIsDeleting(false)
      toast.error(t('courseDeletedError'))
    }
  }, [course.id, onRemove, setCourses, t])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline">
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          {course.archivedAt ? (
            <AlertDialog onOpenChange={setArchiveDialogOpen} open={archiveDialogOpen}>
              <AlertDialogTrigger className="w-full">
                <DropdownMenuItem onSelect={e => e.preventDefault()}>
                  <ArchiveIcon />
                  {t('unarchive')}
                </DropdownMenuItem>
              </AlertDialogTrigger>
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
          ) : (
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
          )}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <RocketIcon className="size-4 text-muted-foreground" />
              {t('publishIn')}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {localeItems.map(item => (
                <DropdownMenuItem key={item.value}>{`${item.displayLabel} ${item.icon}`}</DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
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
  )
})
