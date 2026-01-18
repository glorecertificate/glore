'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { InfoIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { listSkillGroups } from '@/actions/course'
import { useSession } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type Course, type SkillGroup } from '@/db/queries'
import { type Enums } from '@/db/types'
import { postgrestError } from '@/db/utils'
import { useI18n } from '@/hooks/use-i18n'
import { SLUG_REGEX } from '@/lib/constants'

interface CourseSettingsModalProps {
  course?: Partial<Course>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CourseSettingsModal = ({ course, open, onOpenChange }: CourseSettingsModalProps) => {
  const router = useRouter()
  const { localize } = useI18n()
  const tCommon = useTranslations('Common')
  const t = useTranslations('Courses')

  const { addCourse } = useSession()

  const [type, setType] = useState<Enums<'course_type'>>(course?.type ?? 'intro')
  const [slug, setSlug] = useState(course?.slug ?? '')
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([])
  const [skillGroupId, setSkillGroupId] = useState<number | null>(course?.skillGroup?.id ?? null)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const disabledMessage = useMemo(() => {
    if (!slug) return t('enterCourseSlug')
    if (type === 'skill' && !skillGroupId) return t('selectSkillGroup')
    return null
  }, [skillGroupId, slug, t, type])

  const isDisabled = useMemo(() => !!disabledMessage || isCreating, [disabledMessage, isCreating])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (isCreating) return
      onOpenChange(open)
      if (open) return
      setType('intro')
      setSlug('')
      setSkillGroupId(null)
    },
    [isCreating, onOpenChange]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsCreating(true)

      if (!SLUG_REGEX.test(slug)) {
        toast.error(t('invalidSlugFormat'))
        setIsCreating(false)
        return
      }

      try {
        const course = await addCourse({ slug, type, skill_group_id: skillGroupId })
        handleOpenChange(false)
        toast.success(t('courseCreated'))
        router.push(`/courses/${course.slug}`)
      } catch (e) {
        const error = postgrestError(e)
        console.error(error.message, error)
        toast.error(error.code === '23505' ? t('courseSlugTaken') : t('courseCreationFailed'))
      } finally {
        setIsCreating(false)
      }
    },
    [addCourse, handleOpenChange, router, skillGroupId, slug, t, type]
  )

  const handleTypeChange = useCallback(
    async (value: string) => {
      const type = value as Enums<'course_type'>
      setType(type)

      if (type === 'intro') return setSkillGroupId(null)

      if (skillGroups.length > 0) return
      setIsLoadingGroups(true)

      try {
        setSkillGroups(await listSkillGroups())
      } catch (e) {
        console.error(e)
        toast.error(t('failedToLoadSkillGroups'))
      } finally {
        setIsLoadingGroups(false)
      }
    },
    [skillGroups.length, t]
  )

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('newCourse')}</DialogTitle>
            <DialogDescription>{t('newCourseDescription')}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>{t('courseType')}</Label>
              <Tabs onValueChange={handleTypeChange} value={type}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="intro">{t('courseTypeIntroductory')}</TabsTrigger>
                  <TabsTrigger value="skill">{t('courseTypeSoftSkill')}</TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-muted-foreground text-sm">
                {type === 'skill' ? t('courseTypeSoftSkillDescription') : t('courseTypeIntroductoryDescription')}
              </p>
            </div>

            {type === 'skill' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="skill-group">{t('skillGroup')}</Label>
                <Select
                  disabled={isCreating || isLoadingGroups}
                  onValueChange={value => setSkillGroupId(Number(value))}
                  value={skillGroupId?.toString()}
                >
                  <SelectTrigger id="skill-group">
                    <SelectValue placeholder={isLoadingGroups ? t('loading') : t('selectSkillGroup')} />
                  </SelectTrigger>
                  <SelectContent>
                    {skillGroups.map(group => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {localize(group.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-sm">{t('skillGroupDescription')}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="course-slug">{t('courseSlug')}</Label>
              <Input
                autoComplete="off"
                disabled={isCreating}
                id="course-slug"
                onChange={e => setSlug(e.target.value)}
                placeholder={t('courseSlugPlaceholder')}
                value={slug}
              />
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <InfoIcon className="size-3.5 shrink-0" />
                <span>{t('courseSlugDescription')}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <div className="flex w-full flex-col gap-1.5">
              <div className="flex justify-end gap-2">
                <Button disabled={isCreating} onClick={() => handleOpenChange(false)} type="button" variant="outline">
                  {tCommon('cancel')}
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button disabled={isDisabled} loading={isCreating} type="submit" variant="brand">
                      {t('createCourse')}
                    </Button>
                  </TooltipTrigger>
                  {disabledMessage && <TooltipContent>{disabledMessage}</TooltipContent>}
                </Tooltip>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
