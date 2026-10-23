'use client'

import { PlusIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'

import { FieldError } from '@/components/features/certificates/field-error'
import { meetsActivityRule } from '@/components/features/certificates/rules'
import { MAX_CERTIFICATE_TASKS, MAX_TASK_LENGTH } from '@/components/features/certificates/schemas'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import appConfig from '~/config/app.json'

export interface ExperienceFormValues {
  activityDuration?: number
  activityEndDate: string
  activityLocation: string
  activityStartDate: string
  tasks: { text: string }[]
}

const ActivityRule = () => {
  const t = useTranslations('Certificates.wizard')
  const { control } = useFormContext<ExperienceFormValues>()
  const [activityDuration, activityEndDate, activityStartDate] = useWatch({
    control,
    name: ['activityDuration', 'activityEndDate', 'activityStartDate'],
  })
  if (!(activityStartDate && activityEndDate && activityEndDate >= activityStartDate)) return null

  const met = meetsActivityRule({ activityDuration: Number(activityDuration) || 0, activityEndDate, activityStartDate })
  return (
    <Banner variant={met ? 'success' : 'warning'}>
      <p>
        {met
          ? t('activityRuleMet')
          : t('activityRuleUnmet', { hours: appConfig.minActivityHours, months: appConfig.minActivityMonths })}
      </p>
    </Banner>
  )
}

const TaskLength = ({ index }: { index: number }) => {
  const { control } = useFormContext<ExperienceFormValues>()
  const text = useWatch({ control, name: `tasks.${index}.text` })
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {(text ?? '').length}
      {'/'}
      {MAX_TASK_LENGTH}
    </span>
  )
}

export const ExperienceFields = () => {
  const t = useTranslations('Certificates.wizard')
  const { control } = useFormContext<ExperienceFormValues>()

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="activityStartDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('startDate')}</FormLabel>
              <DatePicker onBlur={field.onBlur} onChange={field.onChange} value={field.value} />
              <FieldError />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="activityEndDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('endDate')}</FormLabel>
              <DatePicker onBlur={field.onBlur} onChange={field.onChange} value={field.value} />
              <FieldError />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="activityDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('hours')}</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  min={1}
                  onBlur={field.onBlur}
                  onChange={event => field.onChange(event.target.value === '' ? undefined : Number(event.target.value))}
                  placeholder={t('hoursPlaceholder')}
                  ref={field.ref}
                  type="number"
                  value={field.value ?? ''}
                />
              </FormControl>
              <FieldError />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="activityLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('location')}</FormLabel>
              <FormControl>
                <Input autoComplete="off" placeholder={t('locationPlaceholder')} {...field} />
              </FormControl>
              <FieldError />
            </FormItem>
          )}
        />
      </div>
      <ActivityRule />
    </div>
  )
}

export const TaskFields = () => {
  const t = useTranslations('Certificates.wizard')
  const { control } = useFormContext<ExperienceFormValues>()
  const { append, fields, remove } = useFieldArray({ control, name: 'tasks' })

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">{t('tasksTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('tasksDescription', { max: MAX_CERTIFICATE_TASKS })}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {fields.map((item, index) => (
          <li key={item.id}>
            <FormField
              control={control}
              name={`tasks.${index}.text`}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>{t('taskLabel', { number: index + 1 })}</FormLabel>
                    <TaskLength index={index} />
                  </div>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        autoComplete="off"
                        maxLength={MAX_TASK_LENGTH + 40}
                        placeholder={t('taskPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <Button
                      aria-label={t('removeTask', { number: index + 1 })}
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <XIcon />
                    </Button>
                  </div>
                  <FieldError />
                </FormItem>
              )}
            />
          </li>
        ))}
      </ul>
      <Button
        className="self-start"
        disabled={fields.length >= MAX_CERTIFICATE_TASKS}
        icon={PlusIcon}
        onClick={() => append({ text: '' })}
        size="sm"
        type="button"
        variant="outline"
      >
        {t('addTask')}
      </Button>
    </div>
  )
}
