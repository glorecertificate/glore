'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { type PostgrestError } from '@supabase/supabase-js'
import { InfoIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

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
import { useI18n } from '@/hooks/use-i18n'
import { useSession } from '@/hooks/use-session'
import { type Course, type Enums, getSkillGroups, type SkillGroup } from '@/lib/data'

const SLUG_REGEX = /^[a-z0-9-]+$/

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

  const { createCourse } = useSession()

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
        const course = await createCourse({ slug, type, skill_group_id: skillGroupId })
        handleOpenChange(false)
        toast.success(t('courseCreated'))
        router.push(`/courses/${course.slug}`)
      } catch (e) {
        const error = e as PostgrestError
        console.error(error.message, error)
        toast.error(error.code === '23505' ? t('courseSlugTaken') : t('courseCreationFailed'))
      } finally {
        setIsCreating(false)
      }
    },
    [createCourse, handleOpenChange, router, skillGroupId, slug, t, type]
  )

  const handleTypeChange = useCallback(
    async (value: string) => {
      const type = value as Enums<'course_type'>
      setType(type)

      if (type === 'intro') return setSkillGroupId(null)

      if (skillGroups.length > 0) return
      setIsLoadingGroups(true)

      try {
        setSkillGroups(await getSkillGroups())
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
      <DialogContent className="sm:max-w-[500px]">
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
                        {localize(group.name as Record<string, string>)}
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
                <Button disabled={isDisabled} disabledCursor loading={isCreating} type="submit" variant="brand">
                  {t('createCourse')}
                </Button>
              </div>
              {disabledMessage && <p className="text-right text-muted-foreground text-xs">{disabledMessage}</p>}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
