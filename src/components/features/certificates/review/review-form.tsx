'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { claimCertificateReview, reviewCertificate } from '@/actions/certificate'
import { type ReviewCertificateValues, reviewCertificateSchema } from '@/components/features/certificates/schemas'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { type Certificate } from '@/db/queries/certificate'

interface ReviewFormProps {
  certificate: Certificate
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ReviewForm = ({ certificate, onOpenChange, open }: ReviewFormProps) => {
  const t = useTranslations('Certificates')
  const router = useRouter()

  const form = useForm<ReviewCertificateValues>({
    resolver: zodResolver(reviewCertificateSchema),
    defaultValues: {
      action: 'approve',
      activityStartDate: certificate.activityStartDate,
      activityEndDate: certificate.activityEndDate,
      activityDuration: certificate.activityDuration,
      activityLocation: certificate.activityLocation,
      activityDescription: certificate.activityDescription,
      skillCourseIds: certificate.skills.map(s => s.course.id),
    },
  })

  const action = form.watch('action')
  const isSubmitting = form.formState.isSubmitting

  useEffect(() => {
    if (open && certificate.isSubmitted) {
      void claimCertificateReview(certificate.id)
    }
  }, [certificate.id, certificate.isSubmitted, open])

  const onSubmit = async (values: ReviewCertificateValues) => {
    const { error } = await reviewCertificate(certificate.id, values)
    if (error) {
      toast.error(t('reviewError'))
      return
    }
    toast.success(values.action === 'approve' ? t('reviewApproveSuccess') : t('reviewRequestChangesSuccess'))
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('reviewTitle')}</DialogTitle>
          <DialogDescription>
            {certificate.user
              ? `${certificate.user.firstName} ${certificate.user.lastName} — ${certificate.organization.name}`
              : certificate.organization.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex-1 space-y-5 overflow-y-auto px-1 pb-2">
              {/* Action */}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => form.setValue('action', 'approve')}
                  type="button"
                  variant={action === 'approve' ? 'brand' : 'outline'}
                >
                  {t('reviewApprove')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => form.setValue('action', 'request_changes')}
                  type="button"
                  variant={action === 'request_changes' ? 'destructive' : 'outline'}
                >
                  {t('reviewRequestChanges')}
                </Button>
              </div>

              {action === 'request_changes' && (
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('reviewComment')}</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-24 resize-none"
                          placeholder={t('reviewCommentPlaceholder')}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Separator />

              {/* Activity dates */}
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
                        min={1}
                        type="number"
                        {...field}
                        onChange={e => field.onChange(e.target.valueAsNumber)}
                        value={field.value ?? ''}
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
                      <Input placeholder={t('activityLocationPlaceholder')} {...field} value={field.value ?? ''} />
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
                      <Textarea
                        className="min-h-20 resize-none"
                        placeholder={t('activityDescriptionPlaceholder')}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Skills */}
              {certificate.skills.length > 0 && (
                <FormField
                  control={form.control}
                  name="skillCourseIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t('skills')}</FormLabel>
                      <div className="mt-1 space-y-2">
                        {certificate.skills.map(skill => {
                          const title = skill.course.title
                            ? typeof skill.course.title === 'string'
                              ? skill.course.title
                              : ((skill.course.title as Record<string, string>)[certificate.language] ??
                                (skill.course.title as Record<string, string>).en ??
                                skill.course.slug)
                            : skill.course.slug
                          return (
                            <FormField
                              key={skill.course.id}
                              control={form.control}
                              name="skillCourseIds"
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(skill.course.id)}
                                      onCheckedChange={checked => {
                                        const current = field.value ?? []
                                        field.onChange(
                                          checked
                                            ? [...current, skill.course.id]
                                            : current.filter(id => id !== skill.course.id)
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
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting
                  ? t('reviewSubmitting')
                  : action === 'approve'
                    ? t('reviewApprove')
                    : t('reviewRequestChanges')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
