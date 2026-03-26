'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { type Locale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { createCertificate } from '@/actions/certificate-management'
import { CertificatePreview } from '@/components/features/certificates/preview'
import {
  type CertificateFormValues,
  certificateFormSchema,
  draftCertificateSchema,
} from '@/components/features/certificates/schemas'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LanguageSelect } from '@/components/ui/language-select'
import { RatingGroup } from '@/components/ui/rating-group'
import { Textarea } from '@/components/ui/textarea'
import { type Course } from '@/db/queries/course'
import { type User } from '@/db/queries/user'

interface CertificateFormProps {
  user: User
  orgName: string
  orgLogoUrl?: string | null
  completedSkillCourses: Course[]
}

export const CertificateForm = ({ user, orgName, orgLogoUrl, completedSkillCourses }: CertificateFormProps) => {
  const t = useTranslations('Certificates')
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  const form = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateFormSchema) as never,
    defaultValues: {
      activityStartDate: '',
      activityEndDate: '',
      activityDuration: undefined,
      activityLocation: '',
      activityDescription: '',
      organizationRating: 0 as number,
      language: 'en',
      skillCourseIds: [],
    },
  })

  const values = form.watch()

  const selectedSkillNames = useMemo(
    () =>
      completedSkillCourses
        .filter(c => values.skillCourseIds?.includes(c.id))
        .map(c =>
          typeof c.title === 'string'
            ? c.title
            : ((c.title as Record<string, string>)[values.language] ?? (c.title as Record<string, string>).en ?? '')
        ),
    [completedSkillCourses, values.skillCourseIds, values.language]
  )

  const onSubmit = async (data: CertificateFormValues) => {
    setIsSubmitting(true)
    const result = await createCertificate(data)
    setIsSubmitting(false)

    if (result.error) {
      toast.error(t('submitError'))
      return
    }

    toast.success(t('submitSuccess'))
    router.push('/certificates')
  }

  const onSaveDraft = async () => {
    const raw = form.getValues()
    const parsed = draftCertificateSchema.safeParse(raw)

    if (!parsed.success) {
      toast.error(t('draftError'))
      return
    }

    setIsSavingDraft(true)
    const result = await createCertificate(parsed.data, { draft: true })
    setIsSavingDraft(false)

    if (result.error) {
      toast.error(t('draftError'))
      return
    }

    toast.success(t('draftSuccess'))
    router.push('/certificates')
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col overflow-y-auto">
        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Skills */}
            <FormField
              control={form.control}
              name="skillCourseIds"
              render={() => (
                <FormItem>
                  <FormLabel>{t('skills')}</FormLabel>
                  <p className="text-xs text-muted-foreground">{t('skillsDescription')}</p>
                  <div className="mt-2 space-y-2">
                    {completedSkillCourses.map(course => {
                      const title =
                        typeof course.title === 'string'
                          ? course.title
                          : ((course.title as Record<string, string>)[values.language] ??
                            (course.title as Record<string, string>).en ??
                            '')
                      return (
                        <FormField
                          key={course.id}
                          control={form.control}
                          name="skillCourseIds"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(course.id)}
                                  onCheckedChange={checked => {
                                    const current = field.value ?? []
                                    field.onChange(
                                      checked ? [...current, course.id] : current.filter(id => id !== course.id)
                                    )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="cursor-pointer font-normal">{title}</FormLabel>
                            </FormItem>
                          )}
                        />
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Language */}
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('language')}</FormLabel>
                  <FormControl>
                    <LanguageSelect controlled value={field.value as Locale} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="activityStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('activityStartDate')}</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="activityEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('activityEndDate')}</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Duration */}
            <FormField
              control={form.control}
              name="activityDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('activityDuration')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="e.g. 40"
                      {...field}
                      onChange={e => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="activityLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('activityLocation')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('activityLocationPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="activityDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('activityDescription')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('activityDescriptionPlaceholder')} className="min-h-28" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rating */}
            <FormField
              control={form.control}
              name="organizationRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('organizationRating')}</FormLabel>
                  <FormControl>
                    <RatingGroup
                      id="organization-rating"
                      value={String(field.value ?? 0)}
                      label={t('organizationRating')}
                      onValueChange={v => field.onChange(Number(v))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button
                className="flex-1"
                disabled={isSubmitting || isSavingDraft}
                loading={isSavingDraft}
                loadingText={t('savingDraft')}
                onClick={onSaveDraft}
                type="button"
                variant="outline"
              >
                {t('saveDraft')}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || isSavingDraft}
                loading={isSubmitting}
                loadingText={t('submitting')}
              >
                {t('submitCertificate')}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Right: live PDF preview */}
      <div className="hidden lg:flex lg:flex-col lg:items-stretch">
        <p className="mb-2 text-sm font-medium text-muted-foreground">{t('preview')}</p>
        <div className="min-h-0 flex-1 overflow-hidden rounded-lg bg-muted">
          <CertificatePreview
            values={values}
            volunteerName={user.shortName}
            orgName={orgName}
            orgLogoUrl={orgLogoUrl}
            skillNames={selectedSkillNames}
          />
        </div>
      </div>
    </div>
  )
}
