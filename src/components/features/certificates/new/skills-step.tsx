'use client'

import { useTranslations } from 'next-intl'
import { useFieldArray, useFormContext, useFormState, useWatch } from 'react-hook-form'

import { FieldError } from '@/components/features/certificates/field-error'
import { LevelPicker } from '@/components/features/certificates/level-picker'
import { SectionNote } from '@/components/features/certificates/new/section-note'
import { type SkillOption } from '@/components/features/certificates/new/values'
import { MAX_EVIDENCE_LENGTH, type WizardValues } from '@/components/features/certificates/schemas'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { Checkbox } from '@/components/ui/checkbox'
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { SKILL_LEVELS } from '@/lib/constants'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'
import appConfig from '~/config/app.json'

const EvidenceLength = ({ index }: { index: number }) => {
  const { control } = useFormContext<WizardValues>()
  const text = useWatch({ control, name: `skills.${index}.evidence` })
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {(text ?? '').length}
      {'/'}
      {MAX_EVIDENCE_LENGTH}
    </span>
  )
}

const SkillsError = () => {
  const t = useTranslations('Certificates.errors')
  const { errors } = useFormState<WizardValues>({ name: 'skills' })
  const code = errors.skills?.root?.message ?? errors.skills?.message
  if (!code) return null

  return (
    <p className="text-sm text-destructive" role="alert">
      {t(code as never)}
    </p>
  )
}

export const SkillsStep = ({ comment, options }: { comment?: string; options: SkillOption[] }) => {
  const t = useTranslations('Certificates.wizard')
  const tLevels = useTranslations('Common.skillLevels')
  const { localize } = useI18n()
  const { control } = useFormContext<WizardValues>()
  const { append, fields, remove } = useFieldArray({ control, name: 'skills' })
  const atMax = fields.length >= appConfig.maxSkills

  const toggle = (option: SkillOption, selectedIndex: number) => {
    if (selectedIndex >= 0) return remove(selectedIndex)
    append({
      courseId: option.id,
      evidence: option.reflection?.slice(0, MAX_EVIDENCE_LENGTH) ?? '',
      selfLevel: option.selfLevel ?? (undefined as never),
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionNote comment={comment} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t('skillsDescription', { max: appConfig.maxSkills, min: appConfig.minSkills })}
        </p>
        <p aria-live="polite" className="text-sm font-medium tabular-nums">
          {t('skillsSelected', { count: fields.length, max: appConfig.maxSkills })}
        </p>
      </div>
      <SkillsError />
      <ul className="flex flex-col gap-3">
        {options.map(option => {
          const index = fields.findIndex(field => field.courseId === option.id)
          const selected = index >= 0
          const title = option.title ? localize(option.title, 'en') : option.slug
          const suggestion = SKILL_LEVELS[(option.selfLevel ?? 0) - 1]
          return (
            <li
              className={cn('rounded-lg border p-4 transition-colors', selected && 'border-primary/50 bg-primary/5')}
              key={option.id}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  aria-label={title}
                  checked={selected}
                  disabled={!selected && atMax}
                  id={`skill-${option.id}`}
                  onCheckedChange={() => toggle(option, index)}
                />
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2" htmlFor={`skill-${option.id}`}>
                  {option.icon && (
                    <LucideIcon className="size-4 shrink-0 text-brand-secondary-text" name={option.icon as IconName} />
                  )}
                  <span className="truncate text-sm font-medium">{title}</span>
                </label>
                {suggestion && (
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {t('assessedAs', { level: tLevels(suggestion) })}
                  </span>
                )}
              </div>
              {selected && (
                <div className="mt-4 grid gap-4 border-t pt-4">
                  <FormField
                    control={control}
                    name={`skills.${index}.selfLevel`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('selfLevel')}</FormLabel>
                        <LevelPicker aria-label={t('selfLevel')} onValueChange={field.onChange} value={field.value} />
                        <FieldError />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`skills.${index}.evidence`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between gap-2">
                          <FormLabel>{t('evidence')}</FormLabel>
                          <EvidenceLength index={index} />
                        </div>
                        <FormControl>
                          <Textarea className="min-h-20" placeholder={t('evidencePlaceholder')} {...field} />
                        </FormControl>
                        <FieldError />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
