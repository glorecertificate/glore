'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { saveSkillCompass } from '@/actions/courses/compass'
import { type CompassOption } from '@/components/features/courses/skill-compass/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { COMPASS_MAX_GOALS, COMPASS_MAX_STRENGTHS } from '@/db/queries/learning'
import { cn } from '@/lib/utils'

const toggle = (setter: React.Dispatch<React.SetStateAction<number[]>>) => (id: number) =>
  setter(prev => (prev.includes(id) ? prev.toSpliced(prev.indexOf(id), 1) : [...prev, id]))

const SkillPicker = ({
  blocked,
  max,
  onToggle,
  options,
  selected,
  title,
  hint,
}: {
  blocked: Set<number>
  hint: string
  max: number
  onToggle: (id: number) => void
  options: CompassOption[]
  selected: number[]
  title: string
}) => {
  const selectedSet = new Set(selected)
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-medium">{title}</legend>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        {options.map(option => {
          const isSelected = selectedSet.has(option.id)
          return (
            <button
              aria-pressed={isSelected}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                isSelected ? 'border-brand bg-brand/15 text-brand-text' : 'hover:bg-muted'
              )}
              disabled={!isSelected && (blocked.has(option.id) || selected.length >= max)}
              key={option.id}
              onClick={() => onToggle(option.id)}
              type="button"
            >
              {option.title}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export const SkillCompassDialog = ({
  children,
  goals: initialGoals,
  options,
  strengths: initialStrengths,
}: React.PropsWithChildren<{ goals: number[]; options: CompassOption[]; strengths: number[] }>) => {
  const t = useTranslations('Learning.catalog.compass')
  const { refresh } = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [strengths, setStrengths] = useState(initialStrengths)
  const [goals, setGoals] = useState(initialGoals)

  const onSave = () => {
    setSaving(true)
    startTransition(async () => {
      const result = await saveSkillCompass({ goals, strengths })
      setSaving(false)
      if ('error' in result) {
        toast.error(t('saveError'))
        return
      }
      toast.success(t('saved'))
      setOpen(false)
      refresh()
    })
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto" size="lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('dialogHint')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <SkillPicker
            blocked={new Set(goals)}
            hint={t('strengthsHint', { max: COMPASS_MAX_STRENGTHS })}
            max={COMPASS_MAX_STRENGTHS}
            onToggle={toggle(setStrengths)}
            options={options}
            selected={strengths}
            title={t('strengthsTitle')}
          />
          <SkillPicker
            blocked={new Set(strengths)}
            hint={t('goalsHint', { max: COMPASS_MAX_GOALS })}
            max={COMPASS_MAX_GOALS}
            onToggle={toggle(setGoals)}
            options={options}
            selected={goals}
            title={t('goalsTitle')}
          />
        </div>
        <DialogFooter>
          <Button loading={saving} onClick={onSave} variant="brand">
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
