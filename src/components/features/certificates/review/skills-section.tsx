'use client'

import { useTranslations } from 'next-intl'
import { useFormContext, useFormState, useWatch } from 'react-hook-form'

import { FieldError } from '@/components/features/certificates/field-error'
import { LevelPicker } from '@/components/features/certificates/level-picker'
import {
  MAX_STATEMENT_LENGTH,
  MIN_ISSUED_LEVEL,
  type ReviewFormValues,
} from '@/components/features/certificates/schemas'
import { useI18n } from '@/components/providers/i18n'
import { Checkbox } from '@/components/ui/checkbox'
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { type Certificate } from '@/db/queries/certificate'
import { SKILL_LEVELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const StatementLength = ({ index }: { index: number }) => {
  const { control } = useFormContext<ReviewFormValues>()
  const text = useWatch({ control, name: `skills.${index}.statement` })
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {(text ?? '').length}
      {'/'}
      {MAX_STATEMENT_LENGTH}
    </span>
  )
}

const SkillsError = () => {
  const t = useTranslations('CertificateErrors')
  const { errors } = useFormState<ReviewFormValues>({ name: 'skills' })
  const code = errors.skills?.root?.message ?? errors.skills?.message
  if (!code) return null

  return (
    <p className="text-sm text-destructive-text" role="alert">
      {t(code as never)}
    </p>
  )
}

export const SkillsSection = ({ certificate }: { certificate: Certificate }) => {
  const t = useTranslations('CertificateReview')
  const tLevels = useTranslations('Common.skillLevels')
  const { localize } = useI18n()
  const { control } = useFormContext<ReviewFormValues>()
  const skills = useWatch({ control, name: 'skills' })
  const stored = new Map(certificate.skills.map(skill => [skill.course.id, skill]))

  return (
    <section aria-labelledby="skills-title" className="flex flex-col gap-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold" id="skills-title">
          {t('skillsTitle')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('skillsDescription', { level: tLevels(SKILL_LEVELS[MIN_ISSUED_LEVEL - 1]!) })}
        </p>
      </div>
      <SkillsError />
      <ul className="flex flex-col gap-3">
        {skills.map((skill, index) => {
          const source = stored.get(skill.courseId)
          const title = source?.course.title ? localize(source.course.title, 'en') : (source?.course.slug ?? '')
          const selfLevel = SKILL_LEVELS[(source?.selfLevel ?? 0) - 1]
          return (
            <li
              className={cn('rounded-lg border p-4', skill.include ? 'border-primary/40' : 'opacity-70')}
              key={skill.courseId}
            >
              <FormField
                control={control}
                name={`skills.${index}.include`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={checked => field.onChange(checked === true)} />
                    </FormControl>
                    <FormLabel className="flex-1 text-sm font-medium">{title}</FormLabel>
                    {selfLevel && (
                      <span className="text-xs text-muted-foreground">
                        {t('selfLevelValue', { level: tLevels(selfLevel) })}
                      </span>
                    )}
                  </FormItem>
                )}
              />
              {skill.include && (
                <div className="mt-4 grid gap-4 border-t pt-4">
                  <FormField
                    control={control}
                    name={`skills.${index}.level`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('confirmedLevel')}</FormLabel>
                        <LevelPicker
                          aria-label={t('confirmedLevel')}
                          min={MIN_ISSUED_LEVEL}
                          onValueChange={field.onChange}
                          value={field.value}
                        />
                        <FieldError />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`skills.${index}.statement`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between gap-2">
                          <FormLabel>{t('statement')}</FormLabel>
                          <StatementLength index={index} />
                        </div>
                        <FormControl>
                          <Textarea className="min-h-20" placeholder={t('statementPlaceholder')} {...field} />
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
    </section>
  )
}
