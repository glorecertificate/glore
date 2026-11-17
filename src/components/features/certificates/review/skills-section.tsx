'use client'

import { useTranslations } from 'next-intl'
import { useFormContext, useFormState, useWatch } from 'react-hook-form'

import { type HolderCourseResult } from '@/actions/certificates/queries'
import { FieldError } from '@/components/features/certificates/field-error'
import { type ReviewFormValues } from '@/components/features/certificates/schemas'
import { useI18n } from '@/components/providers/i18n'
import { Banner } from '@/components/ui/banner'
import { Checkbox } from '@/components/ui/checkbox'
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { LevelDots } from '@/components/ui/level-dots'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { type Certificate } from '@/db/queries/certificate'
import { SKILL_LEVELS, type SkillLevel } from '@/db/queries/skill-level-description'
import { cn } from '@/lib/utils'

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

const LevelChoice = ({
  disabled,
  id,
  onValueChange,
  result,
  value,
}: {
  disabled?: boolean
  id: string
  onValueChange: (level: SkillLevel) => void
  result: HolderCourseResult | undefined
  value: SkillLevel | undefined
}) => {
  const t = useTranslations('CertificateReview')
  const tLevels = useTranslations('Common.skillLevels')
  const { localize } = useI18n()
  const descriptions = result?.descriptions ?? {}

  if (SKILL_LEVELS.some(level => !descriptions[level])) {
    return (
      <Banner variant="warning">
        <p>{t('descriptionsMissing')}</p>
      </Banner>
    )
  }

  return (
    <RadioGroup
      aria-label={t('confirmedLevel')}
      className="gap-2"
      disabled={disabled}
      onValueChange={next => onValueChange(next as SkillLevel)}
      required
      value={value ?? ''}
    >
      {SKILL_LEVELS.map((level, index) => (
        <Label
          className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 leading-relaxed font-normal transition-colors has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-primary/5 has-[:focus-visible]:focus-ring"
          htmlFor={`${id}-${level}`}
          key={level}
        >
          <RadioGroupItem className="mt-0.5" id={`${id}-${level}`} value={level} />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <LevelDots label={tLevels(level)} level={index + 1} steps={SKILL_LEVELS.length} />
              {result?.level === level && <span className="text-xs text-muted-foreground">{t('volunteerChoice')}</span>}
            </span>
            <span className="text-sm">{localize(descriptions[level]!)}</span>
          </span>
        </Label>
      ))}
    </RadioGroup>
  )
}

export const SkillsSection = ({
  certificate,
  results,
}: {
  certificate: Certificate
  results: Record<number, HolderCourseResult>
}) => {
  const t = useTranslations('CertificateReview')
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
        <p className="text-sm text-muted-foreground">{t('skillsDescription')}</p>
      </div>
      <SkillsError />
      <ul className="flex flex-col gap-3">
        {skills.map((skill, index) => {
          const source = stored.get(skill.courseId)
          const title = source?.course.title ? localize(source.course.title, 'en') : (source?.course.slug ?? '')
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
                  </FormItem>
                )}
              />
              {skill.include && (
                <div className="mt-4 grid gap-3 border-t pt-4">
                  <FormField
                    control={control}
                    name={`skills.${index}.level`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('confirmedLevel')}</FormLabel>
                        <LevelChoice
                          id={`skill-${skill.courseId}`}
                          onValueChange={field.onChange}
                          result={results[skill.courseId]}
                          value={field.value}
                        />
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
