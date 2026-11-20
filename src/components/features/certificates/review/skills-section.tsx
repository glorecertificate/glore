'use client'

import { useTranslations } from 'next-intl'
import { useFormContext, useFormState, useWatch } from 'react-hook-form'

import { type HolderCourseResult } from '@/actions/certificates/queries'
import { FieldError } from '@/components/features/certificates/field-error'
import { type ReviewFormValues } from '@/components/features/certificates/schemas'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
    <p className="text-sm text-danger-text" role="alert">
      {t(code as never)}
    </p>
  )
}

const LevelHeader = () => {
  const tLevels = useTranslations('Common.skillLevels')
  const t = useTranslations('CertificateReview')

  return (
    <div
      aria-hidden
      className="hidden items-center gap-3 border-b border-border-subtle pb-3 xl:grid xl:grid-cols-[12rem_repeat(3,minmax(0,1fr))]"
    >
      <span className="type-overline text-muted-foreground">{t('sectionSkills')}</span>
      {SKILL_LEVELS.map((level, index) => (
        <LevelDots key={level} label={tLevels(level)} level={index + 1} steps={SKILL_LEVELS.length} />
      ))}
    </div>
  )
}

const LevelCell = ({
  id,
  index,
  level,
  text,
  volunteer,
}: {
  id: string
  index: number
  level: SkillLevel
  text: string
  volunteer: boolean
}) => {
  const t = useTranslations('CertificateReview')
  const tLevels = useTranslations('Common.skillLevels')

  return (
    <Label
      className="group/cell relative flex cursor-pointer items-stretch rounded-lg border border-border-subtle bg-card p-4 text-sm leading-relaxed font-normal shadow-xs transition duration-150 hover:border-border-strong hover:bg-surface-hover has-focus-visible:focus-ring has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50 has-data-disabled:hover:border-border-subtle has-data-disabled:hover:bg-card has-data-[state=checked]:border-action has-data-[state=checked]:bg-action-subtle has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-action motion-reduce:transition-none"
      htmlFor={id}
    >
      <RadioGroupItem
        className="absolute inset-0 size-full cursor-pointer rounded-lg opacity-0 disabled:cursor-not-allowed"
        id={id}
        value={level}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-3">
        <span className="flex min-h-5 flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-4.5 shrink-0 items-center justify-center rounded-full border border-border-strong bg-field text-action-foreground transition-colors group-has-data-[state=checked]/cell:border-action group-has-data-[state=checked]/cell:bg-action"
            >
              <LucideIcon
                className="size-3 opacity-0 transition-opacity group-has-data-[state=checked]/cell:opacity-100"
                name="check"
              />
            </span>
            <span className="xl:hidden">
              <LevelDots label={tLevels(level)} level={index + 1} steps={SKILL_LEVELS.length} />
            </span>
            <span className="sr-only max-xl:hidden">{tLevels(level)}</span>
          </span>
          {volunteer && (
            <span className="inline-flex items-center rounded-full border border-success-border bg-success-subtle px-2 py-0.5 text-xs font-medium text-success-text">
              {t('volunteerChoice')}
            </span>
          )}
        </span>
        <span className="text-foreground">{text}</span>
      </span>
    </Label>
  )
}

const Evidence = ({ evidence, reflection }: { evidence: string | null; reflection: string | null }) => {
  const t = useTranslations('CertificateReview')
  if (!(evidence || reflection)) return <p className="text-sm text-muted-foreground">{t('noEvidence')}</p>

  return (
    <Collapsible className="group/evidence flex flex-col gap-3">
      <CollapsibleTrigger asChild>
        <Button className="self-start text-action-text" size="text" type="button" variant="link">
          <LucideIcon
            className="size-3.5 transition-transform group-data-[state=open]/evidence:rotate-90"
            name="chevron-right"
          />
          {t('evidenceReflection')}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="grid gap-5 md:grid-cols-2">
        {evidence && (
          <div className="flex flex-col gap-1.5">
            <p className="type-overline text-muted-foreground">{t('evidence')}</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{evidence}</p>
          </div>
        )}
        {reflection && (
          <div className="flex flex-col gap-1.5">
            <p className="type-overline text-muted-foreground">{t('reflection')}</p>
            <p className="rounded-lg bg-surface-muted p-3 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {reflection}
            </p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
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
  const { locale, localize } = useI18n()
  const { control } = useFormContext<ReviewFormValues>()
  const skills = useWatch({ control, name: 'skills' })
  const stored = new Map(certificate.skills.map(skill => [skill.course.id, skill]))
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })

  return (
    <section aria-labelledby="skills-title">
      <Card className="gap-5 p-5 sm:p-6">
        <CardHeader>
          <CardTitle className="type-heading" id="skills-title">
            {t('skillsTitle')}
          </CardTitle>
          <CardDescription>{t('skillsDescription')}</CardDescription>
        </CardHeader>
        <SkillsError />
        <div className="flex flex-col">
          <LevelHeader />
          <ul className="flex flex-col">
            {skills.map((skill, index) => {
              const source = stored.get(skill.courseId)
              const result = results[skill.courseId]
              const title = source?.course.title ? localize(source.course.title, 'en') : (source?.course.slug ?? '')
              const descriptions = result?.descriptions ?? {}
              const complete = SKILL_LEVELS.every(level => descriptions[level])
              const completed = result?.completedAt
                ? t('completedOn', { date: date.format(new Date(result.completedAt)) })
                : t('notCompleted')
              const caption = skill.include ? completed : t('skillExcluded')
              const reflection = result?.reflection && result.reflection !== source?.evidence ? result.reflection : null

              return (
                <li
                  className="grid gap-4 border-t border-border-subtle py-5 first:border-t-0 first:pt-4 last:pb-0 xl:grid-cols-[12rem_minmax(0,1fr)] xl:gap-x-3"
                  key={skill.courseId}
                >
                  <FormField
                    control={control}
                    name={`skills.${index}.include`}
                    render={({ field }) => (
                      <FormItem className="content-start gap-1.5">
                        <div className="flex items-center gap-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={checked => field.onChange(checked === true)}
                            />
                          </FormControl>
                          <FormLabel
                            className={cn('flex-1 text-sm font-semibold', !field.value && 'text-muted-foreground')}
                          >
                            {title}
                          </FormLabel>
                        </div>
                        <p
                          className={cn(
                            'pl-7 text-xs',
                            skill.include && !result?.completedAt ? 'text-warning-text' : 'text-muted-foreground'
                          )}
                        >
                          {caption}
                        </p>
                      </FormItem>
                    )}
                  />
                  <div className="flex min-w-0 flex-col gap-4">
                    <FormField
                      control={control}
                      name={`skills.${index}.level`}
                      render={({ field }) => (
                        <FormItem>
                          {complete ? (
                            <RadioGroup
                              aria-label={`${title}: ${t('confirmedLevel')}`}
                              className="gap-3 md:grid-cols-3"
                              disabled={!skill.include}
                              onValueChange={next => field.onChange(next as SkillLevel)}
                              required
                              value={field.value ?? ''}
                            >
                              {SKILL_LEVELS.map((level, position) => (
                                <LevelCell
                                  id={`skill-${skill.courseId}-${level}`}
                                  index={position}
                                  key={level}
                                  level={level}
                                  text={localize(descriptions[level]!)}
                                  volunteer={result?.level === level}
                                />
                              ))}
                            </RadioGroup>
                          ) : (
                            <Banner variant="warning">
                              <p>{t('descriptionsMissing')}</p>
                            </Banner>
                          )}
                          {skill.include && <FieldError />}
                        </FormItem>
                      )}
                    />
                    <Evidence evidence={source?.evidence ?? null} reflection={reflection} />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </Card>
    </section>
  )
}
