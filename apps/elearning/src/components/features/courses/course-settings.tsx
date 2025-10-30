'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useId, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { type PostgrestError } from '@supabase/supabase-js'
import { Link2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { type Enums } from 'supabase/types'
import z from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useIntl } from '@/hooks/use-intl'
import { useSession } from '@/hooks/use-session'
import { COURSE_SLUG_REGEX, COURSE_TYPES, type Course } from '@/lib/data'
import { cn } from '@/lib/utils'

interface CourseSettingsProps {
  course?: Partial<Course>
}

export const CourseSettings = ({ course: initialCourse }: CourseSettingsProps) => {
  const router = useRouter()

  const { localize } = useIntl()
  const { createCourse, skillGroups, updateCourseSettings } = useSession()
  const tCommon = useTranslations('Common')
  const t = useTranslations('Courses')

  const isNew = useMemo(() => !initialCourse, [initialCourse])

  const formSchema = useMemo(
    () =>
      z.object({
        type: z.enum(COURSE_TYPES),
        skill_group_id: z.number().nullable(),
        slug: z.string().regex(COURSE_SLUG_REGEX, t('invalidSlugFormat')).min(5, t('courseSlugTooShort')),
      }),
    [t]
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      type: initialCourse?.type ?? 'intro',
      skill_group_id: initialCourse?.skillGroup?.id ?? null,
      slug: initialCourse?.slug ?? '',
    },
  })
  form.watch()

  const slugId = useId()
  const slugPrefix = useMemo(() => `${window.location.origin}/courses/`, [])

  const disabled = useMemo(
    () => !form.formState.isDirty || form.formState.isSubmitting || !form.formState.isValid,
    [form.formState, form]
  )

  const submitMessage = useMemo(() => {
    if (!form.formState.isDirty) return tCommon('noChangesToSave')
    if (form.formState.isSubmitting) return isNew ? t('creatingCourse') : t('savingChange')
    if (!form.formState.isValid) return // tCommon('fixErrorsToContinue')
    return isNew ? t('createCourse') : t('saveChanges')
  }, [form.formState, isNew, t, tCommon])

  const createSettings = useMemo(
    () => async (schema: z.infer<typeof formSchema>) => {
      try {
        const course = await createCourse(schema)
        toast.success(t('courseCreated'))
        router.push(`/courses/${course.slug}`)
      } catch (e) {
        const error = e as PostgrestError
        console.error(error.message, error)
        toast.error(error.code === '23505' ? t('courseSlugTaken') : t('courseCreationFailed'))
      }
    },
    [createCourse, router, t]
  )

  const updateSettings = useMemo(
    () => async (schema: z.infer<typeof formSchema>) => {
      try {
        if (!initialCourse?.id) return

        const course = await updateCourseSettings(initialCourse.id, schema)
        toast.success(t('courseSettingsUpdated'))
        router.replace(`/courses/${course.slug}`)
      } catch (e) {
        const error = e as PostgrestError
        console.error(error.message, error)
        toast.error(error.code === '23505' ? t('courseSlugTaken') : t('courseCreationFailed'))
      }
    },
    [initialCourse?.id, router, t, updateCourseSettings]
  )

  const onSubmit = useCallback(
    (schema: z.infer<typeof formSchema>) => (isNew ? createSettings(schema) : updateSettings(schema)),
    [createSettings, isNew, updateSettings]
  )

  return (
    <Form {...form}>
      <form className="grid gap-10" onSubmit={form.handleSubmit(onSubmit)}>
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
                <div className="space-y-2.5">
                  <Tabs
                    onValueChange={value => form.setValue('type', value as Enums<'course_type'>)}
                    value={field.value}
                  >
                    <TabsList className="grid grid-cols-2">
                      <TabsTrigger value="intro">{t('courseTypeIntroductory')}</TabsTrigger>
                      <TabsTrigger value="skill">{t('courseTypeSoftSkill')}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <p className="text-xs">
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
              <FormItem
                className={cn('space-y-1', form.getValues('type') === 'intro' && 'pointer-events-none opacity-50')}
              >
                <div className="flex flex-col space-y-1">
                  <FormLabel className="text-[15px]">{t('skillGroup')}</FormLabel>
                  <FormDescription>{t('skillGroupDescription')}</FormDescription>
                </div>
                <Select
                  onValueChange={value => form.setValue('skill_group_id', Number(value))}
                  value={String(field.value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectSkillGroup')} />
                  </SelectTrigger>
                  <SelectContent>
                    {skillGroups.map(group => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {localize(group.name as Record<string, string>)}
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
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText className="text-muted-foreground/80">{slugPrefix}</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    <Link2Icon className="cursor-default" />
                  </InputGroupAddon>
                  <InputGroupInput
                    className="pl-0.5!"
                    disabled={form.formState.isSubmitting}
                    id={slugId}
                    onChange={e => {
                      const { value } = e.target
                      const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                      onChange(slug)
                    }}
                    {...field}
                  />
                </InputGroup>
              </FormItem>
            )}
          />
        </div>
        <div>
          <p className="text-right text-muted-foreground text-xs">{form.formState.errors.slug?.message}</p>
          <Button
            className="w-full [&_svg]:size-4"
            disabled={disabled}
            disabledCursor
            loading={form.formState.isSubmitting}
            type="submit"
            variant="brand"
          >
            {submitMessage}
          </Button>
        </div>
      </form>
    </Form>
  )
}
