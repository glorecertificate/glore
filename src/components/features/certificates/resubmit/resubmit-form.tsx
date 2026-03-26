'use client'

import { useRouter } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { resubmitCertificate } from '@/actions/certificate-management'
import { type ResubmitCertificateValues, resubmitCertificateSchema } from '@/components/features/certificates/schemas'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { type Certificate } from '@/db/queries/certificate'

interface ResubmitFormProps {
  certificate: Certificate
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ResubmitForm = ({ certificate, onOpenChange, open }: ResubmitFormProps) => {
  const t = useTranslations('Certificates')
  const router = useRouter()

  const form = useForm<ResubmitCertificateValues>({
    resolver: zodResolver(resubmitCertificateSchema) as never,
    defaultValues: {
      activityStartDate: certificate.activityStartDate,
      activityEndDate: certificate.activityEndDate,
      activityDuration: certificate.activityDuration,
      activityLocation: certificate.activityLocation,
      activityDescription: certificate.activityDescription,
    },
  })

  const isSubmitting = form.formState.isSubmitting

  const onSubmit = async (values: ResubmitCertificateValues) => {
    const { error } = await resubmitCertificate(certificate.id, values)
    if (error) {
      toast.error(t('resubmitError'))
      return
    }
    toast.success(t('resubmitSuccess'))
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('resubmitTitle')}</DialogTitle>
          <DialogDescription>{t('resubmitDescription')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex-1 space-y-5 overflow-y-auto px-1 pb-2">
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

              <FormField
                control={form.control}
                name="activityDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('activityDescription')}</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-24 resize-none"
                        placeholder={t('activityDescriptionPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button disabled={isSubmitting} type="submit" variant="brand">
                {isSubmitting ? t('resubmitSubmitting') : t('resubmitButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
