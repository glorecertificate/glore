'use client'

import { useCallback, useEffect, useId, useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2Icon, Link2Icon, LoaderCircleIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { checkSlugAvailable } from '@/actions/courses/management'
import { useCourses } from '@/components/providers/courses-context'
import { Button } from '@/components/ui/button'
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { queryError } from '@/db/helpers'
import { COURSE_SLUG_MIN_LENGTH, COURSE_TYPES, type Course } from '@/db/queries/course'
import { useDebounce } from '@/hooks/use-debounce'
import { useI18n } from '@/hooks/use-i18n'
import { SLUG_REGEX } from '@/lib/constants'
import { cn } from '@/lib/utils'

export const courseSettingsSchema = z.object({
  type: z.enum(COURSE_TYPES),
  skillGroupId: z.number().nullable(),
  slug: z.string(),
})

export const CourseSettings = ({
  className,
  course,
  disabled: disabledProp,
  onError,
  onSuccess,
  ...props
}: Omit<React.ComponentProps<'form'>, 'onError' | 'onSubmit'> & {
  course?: Course
  disabled?: boolean
  onError?: (error: { code: string; message: string }) => void
  onSuccess?: (course: Course) => void
}) => {
  const { skillGroups, createCourse, updateCourse } = useCourses()

  const { localize } = useI18n()
  const t = useTranslations('Courses')

  const formSchema = useMemo(
    () =>
      courseSettingsSchema.extend({
        slug: courseSettingsSchema.shape.slug
          .regex(SLUG_REGEX, t('invalidSlugFormat'))
          .min(COURSE_SLUG_MIN_LENGTH, t('courseSlugTooShort', { min: String(COURSE_SLUG_MIN_LENGTH) })),
      }),
    [t]
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      type: course?.type ?? 'intro',
      skillGroupId: course?.skillGroup?.id ?? null,
      slug: course?.slug ?? '',
    },
  })
  form.watch()

  const slugValue = form.getValues('slug')
  const debouncedSlug = useDebounce(slugValue, 500)
  const [slugStatus, setSlugStatus] = useState<'available' | 'checking' | 'idle' | 'taken'>('idle')

  useEffect(() => {
    if (!debouncedSlug || debouncedSlug.length < COURSE_SLUG_MIN_LENGTH || !SLUG_REGEX.test(debouncedSlug)) {
      setSlugStatus('idle')
      return
    }
    if (course?.slug === debouncedSlug) {
      setSlugStatus('idle')
      return
    }

    let cancelled = false
    setSlugStatus('checking')

    const check = async () => {
      try {
        const available = await checkSlugAvailable(debouncedSlug, course?.id)
        if (cancelled) return
        setSlugStatus(available ? 'available' : 'taken')
        if (!available) {
          form.setError('slug', { message: t('courseSlugTaken') })
        }
      } catch {
        if (!cancelled) setSlugStatus('idle')
      }
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [course?.id, course?.slug, debouncedSlug, form, t])

  const slugId = useId()
  const slugPrefix = `${window.location.origin}/courses/`
  const isIntro = form.getValues('type') === 'intro'
  const errors = Object.values(form.formState.errors)
    .map(error => error.message)
    .filter(Boolean)

  const { isValid, isDirty, isSubmitting } = form.formState
  const disabled =
    disabledProp ||
    !(isValid && isDirty) ||
    isSubmitting ||
    (form.getValues('type') === 'skill' && !form.getValues('skillGroupId'))

  const submitMessage = useMemo(() => {
    if (disabledProp && form.formState.isSubmitSuccessful) return t('redirecting')
    if (disabledProp) return course ? t('savingChange') : t('creatingCourse')
    if (course && !form.formState.isDirty) return t('noChangesToSave')
    if (form.formState.isSubmitting) return course ? t('savingChange') : t('creatingCourse')
    return course ? t('saveChanges') : t('createCourse')
  }, [course, disabledProp, form.formState, t])

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

  const onSubmit = useCallback(
    async (schema: z.infer<typeof formSchema>) => {
      try {
        const { data, error } = course ? await updateCourse(course.id, schema) : await createCourse(schema)
        if (error) {
          if (error.code === 'CONFLICT') {
            form.setError('slug', { message: t('courseSlugTaken') })
            form.setFocus('slug')
            return
          }
          onError?.(error)
          return
        }
        if (data) onSuccess?.(data)
      } catch (e) {
        const error = queryError(e)
        console.error(error.code)
      }
    },
    [course, createCourse, form, onError, onSuccess, t, updateCourse]
  )

  return (
    <Form {...form}>
      <form className={cn('grid gap-10', className)} onSubmit={form.handleSubmit(onSubmit)} {...props}>
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
                      form.setValue('skillGroupId', null)
                      field.onChange(value)
                    }}
                    {...field}
                  >
                    <TabsList className="grid min-w-1/3 grid-cols-3">
                      {COURSE_TYPES.map(type => (
                        <TabsTrigger className="h-8 py-0" key={type} size="sm" value={type}>
                          {t(`courseType-${type}`)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <p className="text-xs text-muted-foreground">
                    {t(`courseTypeDescription-${form.getValues('type')}`)}
                  </p>
                </div>
              </FormItem>
            )}
          />
          {form.getValues('type') === 'skill' && (
            <FormField
              control={form.control}
              name="skillGroupId"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <div className="flex flex-col space-y-1">
                    <FormLabel className="text-[15px]">{t('skillGroup')}</FormLabel>
                    <FormDescription>{t('skillGroupDescription')}</FormDescription>
                  </div>
                  <Select
                    onValueChange={value => form.setValue('skillGroupId', value ? Number(value) : null)}
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
          )}
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
                      {slugStatus === 'checking' ? (
                        <LoaderCircleIcon className="animate-spin text-muted-foreground" />
                      ) : slugStatus === 'available' ? (
                        <CheckCircle2Icon className="text-success" />
                      ) : (
                        <Link2Icon className="cursor-default" />
                      )}
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
              loading={disabledProp || form.formState.isSubmitting}
              type="submit"
              variant="brand"
            >
              {submitMessage}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8} size="sm">
            {t('selectSkillGroupToSave')}
          </TooltipContent>
          {errors.length > 0 ? (
            <TooltipContent side="top" sideOffset={8} size="sm">
              {errors.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            </TooltipContent>
          ) : (
            !(isIntro || form.getValues('skillGroupId')) && (
              <TooltipContent side="top" sideOffset={8} size="sm">
                {t('selectSkillGroupToSave')}
              </TooltipContent>
            )
          )}
        </Tooltip>
      </form>
    </Form>
  )
}
