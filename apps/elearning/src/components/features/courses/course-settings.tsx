'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useId, useMemo } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { type PostgrestError } from '@supabase/supabase-js'
import { Link2Icon, RotateCcwIcon, Trash2Icon } from 'lucide-react'
import { type IconName } from 'lucide-react/dynamic'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { IconPicker } from '@/components/ui/icon-picker'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCourse } from '@/hooks/use-course'
import { useIntl } from '@/hooks/use-intl'
import { useSession } from '@/hooks/use-session'
import { COURSE_SLUG_REGEX, COURSE_TYPES } from '@/lib/data'

export const CourseSettings = () => {
  const router = useRouter()
  const { localize } = useIntl()
  const { createCourse, skillGroups, updateCourseSettings } = useSession()
  const { course: initialCourse } = useCourse()
  const tCommon = useTranslations('Common')
  const t = useTranslations('Courses')

  const formSchema = useMemo(
    () =>
      z.object({
        type: z.enum(COURSE_TYPES),
        skill_group_id: z.number().nullable(),
        icon: z.string().optional(),
        slug: z.string().regex(COURSE_SLUG_REGEX, t('invalidSlugFormat')).min(5, t('courseSlugTooShort')),
      }),
    [t]
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: initialCourse?.type ?? 'intro',
      skill_group_id: initialCourse?.skillGroup?.id ?? undefined,
      icon: initialCourse?.icon ?? '',
      slug: initialCourse?.slug ?? '',
    },
  })
  form.watch()

  const slugId = useId()
  const slugPrefix = `${window.location.origin}/courses/`
  const isNew = !initialCourse
  const isIntro = form.getValues('type') === 'intro'

  const disabled = useMemo(
    () => !(form.formState.isValid && form.formState.isDirty) || form.formState.isSubmitting,
    [form.formState, form]
  )

  const submitMessage = useMemo(() => {
    if (!form.formState.isDirty) return tCommon('noChangesToSave')
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
        if (course.slug !== initialCourse.slug) {
          router.replace(`/courses/${course.slug}`)
        }
      } catch (e) {
        const error = e as PostgrestError
        console.error(error.message, error)
        toast.error(error.code === '23505' ? t('courseSlugTaken') : t('courseCreationFailed'))
      }
    },
    [initialCourse?.id, initialCourse?.slug, router, t, updateCourseSettings]
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
            name="icon"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <div className="flex flex-col space-y-1">
                  <FormLabel className="text-[15px]">{t('icon')}</FormLabel>
                  <FormDescription>{t('iconDescription')}</FormDescription>
                </div>
                <div className="flex items-center gap-2">
                  <IconPicker
                    className="w-fit justify-start py-5 font-normal [&>svg]:size-4.5!"
                    defaultValue={field.value as IconName | undefined}
                    onValueChange={field.onChange}
                    variant="outline"
                  />
                  <div className="flex items-center gap-0.5">
                    {field.value && (
                      <Button
                        className="size-7 hover:bg-destructive/15! hover:text-destructive-accent focus:bg-destructive/15! focus:text-destructive-accent"
                        disabled={form.formState.isSubmitting}
                        onClick={() => field.onChange(null)}
                        size="xs"
                        title={t('removeIcon')}
                        variant="ghost"
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    )}
                    {field.value && initialCourse?.icon && field.value !== initialCourse.icon && (
                      <Button
                        className="size-7 hover:bg-destructive/15! hover:text-warning-accent focus:bg-warning/15! focus:text-warning-accent"
                        disabled={form.formState.isSubmitting}
                        onClick={() => field.onChange(initialCourse.icon)}
                        size="xs"
                        title={t('resetIcon')}
                        variant="ghost"
                      >
                        <RotateCcwIcon className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
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
                      <InputGroupText className="text-muted-foreground/80">{slugPrefix}</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupAddon align="inline-end">
                      <Link2Icon className="cursor-default" />
                    </InputGroupAddon>
                    <InputGroupInput
                      className="pl-0.5!"
                      disabled={form.formState.isSubmitting}
                      id={slugId}
                      onChange={onSlugChange(onChange)}
                      {...field}
                    />
                  </InputGroup>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[15px]">{t('courseType')}</FormLabel>
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
                  onValueChange={value => form.setValue('skill_group_id', Number(value))}
                  value={field.value ? String(field.value) : undefined}
                >
                  <SelectTrigger className="w-fit" disabled={isIntro}>
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
        </div>
        <div>
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
        </div>
      </form>
    </Form>
  )
}
