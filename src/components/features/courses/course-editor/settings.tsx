'use client'

import { useEffect, useId, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2Icon, Link2Icon, LoaderCircleIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { checkSlugAvailable } from '@/actions/courses/management'
import { useCourses } from '@/components/features/courses/context'
import { courseIconVariants } from '@/components/features/courses/course-list/type-select'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { IconPicker } from '@/components/ui/icon-picker'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { queryError } from '@/db/helpers'
import { COURSE_SLUG_MIN_LENGTH, COURSE_TYPES, type Course } from '@/db/queries/course'
import { COURSE_DURATION_MAX, OUTCOMES_MAX, parseOutcomesText, sanitizeOutcomes } from '@/db/queries/course-editing'
import { useDebounce } from '@/hooks/use-debounce'
import { SLUG_REGEX } from '@/lib/constants'
import { LOCALES } from '@/lib/i18n'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

const courseSettingsSchema = z.object({
  durationMinutes: z.number().int().min(1).max(COURSE_DURATION_MAX).nullable(),
  icon: z.string().nullable(),
  outcomes: z.record(z.enum(LOCALES), z.string()),
  type: z.enum(COURSE_TYPES),
  skillGroupId: z.number().nullable(),
  slug: z.string(),
})

const onSlugChange = (onChange: (slug: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
  const { value } = e.target
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9-]/gu, '-')
    .replace(/-+/gu, '-')
  onChange(slug)
}

export const CourseSettings = ({
  className,
  course,
  onError,
  onSuccess,
  ...props
}: Omit<React.ComponentProps<'form'>, 'onError' | 'onSubmit'> & {
  course?: Course
  onError?: (error: { code: string; message: string }) => void
  onSuccess?: (course: Course) => void
}) => {
  const { skillGroups, createCourse, updateCourse } = useCourses()

  const { localeItems, localize } = useI18n()
  const t = useTranslations('Courses')
  const tEditor = useTranslations('Learning.editor')

  const formSchema = courseSettingsSchema.extend({
    slug: courseSettingsSchema.shape.slug
      .regex(SLUG_REGEX, t('invalidSlugFormat'))
      .min(COURSE_SLUG_MIN_LENGTH, t('courseSlugTooShort', { min: String(COURSE_SLUG_MIN_LENGTH) })),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      durationMinutes: course?.durationMinutes ?? null,
      icon: course?.icon ?? null,
      outcomes: LOCALES.reduce(
        (outcomes, locale) => ({ ...outcomes, [locale]: (course?.outcomes?.[locale] ?? []).join('\n') }),
        {} as Record<(typeof LOCALES)[number], string>
      ),
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
    if (
      !debouncedSlug ||
      debouncedSlug.length < COURSE_SLUG_MIN_LENGTH ||
      !SLUG_REGEX.test(debouncedSlug) ||
      course?.slug === debouncedSlug
    ) {
      // eslint-disable-next-line react-doctor/no-adjust-state-on-prop-change
      setSlugStatus('idle')
      return
    }

    let cancelled = false
    // eslint-disable-next-line react-doctor/no-adjust-state-on-prop-change
    setSlugStatus('checking')

    const doCheck = async () => {
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

    void doCheck()

    return () => {
      cancelled = true
    }
  }, [course?.id, course?.slug, debouncedSlug, form, t])

  const slugId = useId()
  const slugPrefix = `${window.location.origin}/courses/`
  const isIntro = form.getValues('type') === 'intro'
  const errors = Object.values(form.formState.errors).flatMap(error => (error.message ? [error.message] : []))

  const { isValid, isDirty, isSubmitting } = form.formState
  const disabled =
    !(isValid && isDirty) || isSubmitting || (form.getValues('type') === 'skill' && !form.getValues('skillGroupId'))

  const submitMessage = (() => {
    if (course && !form.formState.isDirty) return t('noChangesToSave')
    if (form.formState.isSubmitting) return course ? t('savingChange') : t('creatingCourse')
    return course ? t('saveChanges') : t('createCourse')
  })()

  const onSubmit = async (schema: z.infer<typeof formSchema>) => {
    try {
      const payload = {
        ...schema,
        outcomes: sanitizeOutcomes(
          LOCALES.reduce(
            (outcomes, locale) => ({ ...outcomes, [locale]: parseOutcomesText(schema.outcomes[locale]) }),
            {}
          )
        ),
      }
      const { data, error } = course ? await updateCourse(course.id, payload) : await createCourse(payload)
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
  }

  return (
    <Form {...form}>
      <form className={cn('grid gap-10', className)} onSubmit={form.handleSubmit(onSubmit)} {...props}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <div className="flex flex-col gap-y-1">
                  <FormLabel className="text-[15px]">{t('icon')}</FormLabel>
                  <FormDescription>{t('iconDescription')}</FormDescription>
                </div>
                <div className="flex items-center gap-2">
                  <IconPicker value={field.value as IconName} onValueChange={icon => field.onChange(icon)}>
                    <Button className="w-fit animate-none text-[13px] font-normal" type="button" variant="outline">
                      {field.value && (
                        <div>
                          <LucideIcon
                            className={cn('size-4', courseIconVariants({ type: form.getValues('type') }))}
                            name={field.value as IconName}
                          />
                        </div>
                      )}
                      <span className="transition-colors duration-100">
                        {field.value ? t('updateIcon') : t('iconPlaceholder')}
                      </span>
                    </Button>
                  </IconPicker>
                  {field.value && (
                    <Button
                      aria-label={t('removeIcon')}
                      className="size-7 text-muted-foreground transition-colors hover:text-destructive-text"
                      size="icon"
                      type="button"
                      variant="ghost"
                      onClick={() => form.setValue('icon', null, { shouldDirty: true })}
                    >
                      <XIcon className="size-3.5" />
                    </Button>
                  )}
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <div className="flex flex-col gap-y-1">
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
                  <div className="flex flex-col gap-y-1">
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
            name="durationMinutes"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <div className="flex flex-col gap-y-1">
                  <FormLabel className="text-[15px]">{tEditor('durationLabel')}</FormLabel>
                  <FormDescription>{tEditor('durationDescription')}</FormDescription>
                </div>
                <InputGroup className="w-48">
                  <InputGroupInput
                    inputMode="numeric"
                    max={COURSE_DURATION_MAX}
                    min={1}
                    onBlur={field.onBlur}
                    onChange={event => field.onChange(event.target.value === '' ? null : Number(event.target.value))}
                    placeholder={tEditor('durationPlaceholder')}
                    type="number"
                    value={field.value ?? ''}
                  />
                </InputGroup>
                <FormMessage>
                  {form.formState.errors.durationMinutes && tEditor('durationInvalid', { max: COURSE_DURATION_MAX })}
                </FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field: { onChange, ...field } }) => (
              <FormItem className="space-y-1">
                <div className="flex flex-col gap-y-1">
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
                        <CheckCircle2Icon className="text-success-text" />
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
          <div className="space-y-1">
            <div className="flex flex-col gap-y-1">
              <Label className="text-[15px]">{tEditor('outcomesLabel')}</Label>
              <FormDescription>{tEditor('outcomesDescription', { max: OUTCOMES_MAX })}</FormDescription>
            </div>
            <div className="space-y-3">
              {localeItems.map(({ label, value }) => (
                <FormField
                  control={form.control}
                  key={value}
                  name={`outcomes.${value}`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs text-muted-foreground">{label}</FormLabel>
                      <Textarea
                        className="min-h-20 text-sm"
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        placeholder={tEditor('outcomesPlaceholder')}
                        value={field.value}
                      />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>
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
            {t('selectSkillGroupToSave')}
          </TooltipContent>
          {errors.length > 0 ? (
            <TooltipContent side="top" sideOffset={8} size="sm">
              {errors.map(error => (
                <div key={error}>{error}</div>
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
