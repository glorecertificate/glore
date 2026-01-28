'use client'

import { use, useCallback, useId, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Link2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type UseFormReturn, useForm } from 'react-hook-form'
import { z } from 'zod'

import { listSkillGroups } from '@/actions/course'
import { Button } from '@/components/ui/button'
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type Course } from '@/db/queries/course'
import { type Enums } from '@/db/types'
import { useI18n } from '@/hooks/use-i18n'
import { SLUG_REGEX } from '@/lib/constants'
import { cn } from '@/lib/utils'

// const addCourse = useMemo(
//   () => async (data: TableInsert<'courses'>) => {
//     try {
//       const course = await createCourse({
//         ...data,
//         sort_order: courseList.all.length + 1,
//       })
//       router.push(`/courses/${data.slug}`)
//       toast.success(t('courseCreated'), { duration: 4000 })
//     } catch (e) {
//       const error = postgrestError(e)
//       console.error(error.message)
//       if (error.code !== '23505') {
//         toast.error(t('courseCreationFailed'))
//         return
//       }
//       form.setError('slug', { message: t('courseSlugTaken') })
//       form.setFocus('slug')
//     }
//   },
//   [router.push, t, courseList['all'].length, createCourse]
// )

const MIN_SLUG_LENGTH = 3

export type CourseSettingsForm = UseFormReturn<z.infer<typeof courseSettingsSchema>>

export const courseSettingsSchema = z.object({
  type: z.enum<Enums<'course_type'>[]>(['intro', 'skill']),
  skill_group_id: z.number().nullable(),
  slug: z.string(),
})

export const CourseSettings = ({
  className,
  course,
  onSubmit,
  ...props
}: Omit<React.ComponentProps<'form'>, 'onSubmit'> & {
  course?: Course
  onSubmit: (form: UseFormReturn<z.infer<typeof courseSettingsSchema>>) => Promise<void>
}) => {
  const skillGroups = use(listSkillGroups())

  const { localize } = useI18n()
  const tCommon = useTranslations('Common')
  const t = useTranslations('Courses')

  const formSchema = useMemo(
    () =>
      courseSettingsSchema.extend({
        slug: courseSettingsSchema.shape.slug
          .regex(SLUG_REGEX, t('invalidSlugFormat'))
          .min(MIN_SLUG_LENGTH, t('courseSlugTooShort', { min: String(MIN_SLUG_LENGTH) })),
      }),
    [t]
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: course?.type ?? 'intro',
      skill_group_id: course?.skill_group?.id ?? null,
      slug: course?.slug ?? '',
    },
  })
  form.watch()

  const slugId = useId()
  const slugPrefix = `${window.location.origin}/courses/`
  const isNew = !course
  const isIntro = form.getValues('type') === 'intro'
  const errors = Object.values(form.formState.errors)
    .map(error => error.message)
    .filter(Boolean)

  const disabled = useMemo(
    () =>
      !(form.formState.isValid && form.formState.isDirty) ||
      form.formState.isSubmitting ||
      !(isIntro || form.getValues('skill_group_id')),
    [form.formState, form, isIntro]
  )

  const submitMessage = useMemo(() => {
    if (!(isNew || form.formState.isDirty)) return tCommon('noChangesToSave')
    if (form.formState.isSubmitting) return isNew ? t('creatingCourse') : t('savingChange')
    return isNew ? t('createCourse') : t('saveChanges')
  }, [form.formState, isNew, t, tCommon])

  const onSlugChange = useCallback(
    (onChange: (slug: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
      onChange(slug)
    },
    []
  )

  return (
    <Form {...form}>
      <form className={cn('grid gap-10', className)} onSubmit={form.handleSubmit(() => onSubmit(form))} {...props}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <div className="flex flex-col space-y-1">
                  <FormLabel className="text-[15px]">{t('courseType')}</FormLabel>
                  <FormDescription>{t('courseTypeDescription')}</FormDescription>
                </div>
                <div className="space-y-1.5">
                  <Tabs
                    onValueChange={(value: string) => {
                      form.setValue('skill_group_id', null)
                      field.onChange(value)
                    }}
                    {...field}
                  >
                    <TabsList className="grid min-w-1/3 grid-cols-2">
                      <TabsTrigger className="h-7" size="sm" value="intro">
                        {t('courseTypeIntroductory')}
                      </TabsTrigger>
                      <TabsTrigger className="h-7" size="sm" value="skill">
                        {t('courseTypeSoftSkill')}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <p className="text-muted-foreground text-xs">
                    {field.value === 'intro'
                      ? t('courseTypeIntroductoryDescription')
                      : t('courseTypeSoftSkillDescription')}
                  </p>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="skill_group_id"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <div className="flex flex-col space-y-1">
                  <FormLabel className="text-[15px]">{t('skillGroup')}</FormLabel>
                  <FormDescription>{t('skillGroupDescription')}</FormDescription>
                </div>
                <Select
                  onValueChange={value => form.setValue('skill_group_id', value ? Number(value) : null)}
                  value={field.value ? String(field.value) : undefined}
                >
                  <SelectTrigger className="w-fit" disabled={isIntro}>
                    <SelectValue placeholder={t('selectSkillGroup')} />
                  </SelectTrigger>
                  <SelectContent>
                    {skillGroups.map(group => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {localize(group.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field: { onChange, ...field } }) => (
              <FormItem className="space-y-1">
                <div className="flex flex-col space-y-1">
                  <Label className="text-[15px]">{t('courseSlug')}</Label>
                  <FormDescription>{t('courseSlugDescription')}</FormDescription>
                </div>
                <div className="space-y-1.5">
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupText className="font-mono text-[13px] text-muted-foreground/80">
                        {slugPrefix}
                      </InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      className="pl-0.5! font-mono text-[13px]"
                      disabled={form.formState.isSubmitting}
                      id={slugId}
                      onChange={onSlugChange(onChange)}
                      {...field}
                    />
                    <InputGroupAddon align="inline-end">
                      <Link2Icon className="cursor-default" />
                    </InputGroupAddon>
                  </InputGroup>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="w-full [&_svg]:size-4"
              disabled={disabled}
              effect="gooeyLeft"
              loading={form.formState.isSubmitting}
              type="submit"
              variant="brand"
            >
              {submitMessage}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8} size="sm">
            {'Select a skill group to save this course.'}
          </TooltipContent>
          {errors.length > 0 ? (
            <TooltipContent side="top" sideOffset={8} size="sm">
              {errors.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            </TooltipContent>
          ) : (
            !(isIntro || form.getValues('skill_group_id')) && (
              <TooltipContent side="top" sideOffset={8} size="sm">
                {'Select a skill group to save this course.'}
              </TooltipContent>
            )
          )}
        </Tooltip>
      </form>
    </Form>
  )
}
