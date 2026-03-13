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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
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
    defaultValues: { action: 'approve' },
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('reviewTitle')}</DialogTitle>
          <DialogDescription>
            {certificate.user
              ? `${certificate.user.firstName} ${certificate.user.lastName} — ${certificate.organization.name}`
              : certificate.organization.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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
                        className="min-h-28 resize-none"
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

            <DialogFooter>
              <Button disabled={isSubmitting} type="submit" variant={action === 'approve' ? 'brand' : 'destructive'}>
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
