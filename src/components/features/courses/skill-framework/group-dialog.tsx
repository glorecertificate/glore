'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'

import { type Locale, useTranslations } from 'next-intl'

import { saveSkillGroup } from '@/actions/courses/skill-groups'
import {
  type GroupField,
  GroupFieldTranslate,
} from '@/components/features/courses/skill-framework/group-field-translate'
import { GroupLanguageTabs } from '@/components/features/courses/skill-framework/group-language-tabs'
import { LucideIcon } from '@/components/icons/lucide'
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
import { IconPicker } from '@/components/ui/icon-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { DEFAULT_LOCALE, type IntlRecord, LOCALES } from '@/lib/i18n'
import { hasText } from '@/lib/translate'
import { type IconName } from '@/lib/types'

export interface SkillGroupDraft {
  description: IntlRecord | null
  icon: string | null
  id: number
  name: IntlRecord
  slug: string
}

const emptyRecord = () => LOCALES.reduce((record, locale) => ({ ...record, [locale]: '' }), {} as IntlRecord)

export const SkillGroupDialog = ({ children, group }: React.PropsWithChildren<{ group?: SkillGroupDraft }>) => {
  const t = useTranslations('Learning.framework')
  const { refresh } = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [language, setLanguage] = useState<Locale>(DEFAULT_LOCALE)
  const [translating, setTranslating] = useState<GroupField | null>(null)
  const [name, setName] = useState<IntlRecord>(group?.name ?? emptyRecord())
  const [description, setDescription] = useState<IntlRecord>(group?.description ?? emptyRecord())
  const [icon, setIcon] = useState<string | null>(group?.icon ?? null)

  const baseName = group?.name ?? emptyRecord()
  const baseDescription = group?.description ?? emptyRecord()
  const status = Object.fromEntries(
    LOCALES.map(locale => [
      locale,
      {
        complete: hasText(name[locale]) && hasText(description[locale]),
        hasUpdates: name[locale] !== baseName[locale] || description[locale] !== (baseDescription[locale] ?? ''),
      },
    ])
  )

  const applyTranslated = (field: GroupField, locale: Locale, value: string, seen: string) => {
    const update = (prev: IntlRecord) =>
      hasText(prev[locale]) && prev[locale] !== seen ? prev : { ...prev, [locale]: value }
    if (field === 'name') setName(update)
    if (field === 'description') setDescription(update)
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const missing = LOCALES.find(locale => !hasText(name[locale]))
    if (missing && missing !== language) {
      setLanguage(missing)
      requestAnimationFrame(() => form.reportValidity())
      return
    }
    setSaving(true)
    startTransition(async () => {
      const result = await saveSkillGroup({ description, icon, id: group?.id, name })
      setSaving(false)
      if ('error' in result) {
        toast.error(t('saveError'))
        return
      }
      toast.success(t('saved'))
      setOpen(false)
      if (!group) {
        setName(emptyRecord())
        setDescription(emptyRecord())
        setIcon(null)
        setLanguage(DEFAULT_LOCALE)
      }
      refresh()
    })
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto" size="lg">
        <form className="flex flex-col gap-6" method="post" onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{group ? t('editGroup') : t('addGroup')}</DialogTitle>
            <DialogDescription>{group ? `${t('slugLabel')}: ${group.slug}` : t('description')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>{t('iconLabel')}</Label>
              <IconPicker onValueChange={setIcon} value={(icon ?? undefined) as IconName | undefined}>
                <Button className="w-fit" type="button" variant="outline">
                  {icon && <LucideIcon className="size-4" name={icon as IconName} />}
                  {t('iconChoose')}
                </Button>
              </IconPicker>
            </div>
            <Tabs className="gap-4" onValueChange={value => setLanguage(value as Locale)} value={language}>
              <GroupLanguageTabs status={status} />
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="group-name">{t('nameLabel')}</Label>
                  <GroupFieldTranslate
                    field="name"
                    language={language}
                    onApply={applyTranslated}
                    onRunningChange={running => setTranslating(running ? 'name' : null)}
                    values={name}
                  />
                </div>
                <Input
                  aria-busy={translating === 'name'}
                  id="group-name"
                  maxLength={80}
                  onChange={event => setName(prev => ({ ...prev, [language]: event.target.value }))}
                  readOnly={translating === 'name'}
                  required
                  value={name[language] ?? ''}
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="group-description">{t('descriptionLabel')}</Label>
                  <GroupFieldTranslate
                    field="description"
                    language={language}
                    onApply={applyTranslated}
                    onRunningChange={running => setTranslating(running ? 'description' : null)}
                    values={description}
                  />
                </div>
                <Textarea
                  aria-busy={translating === 'description'}
                  id="group-description"
                  maxLength={300}
                  onChange={event => setDescription(prev => ({ ...prev, [language]: event.target.value }))}
                  readOnly={translating === 'description'}
                  value={description[language] ?? ''}
                />
              </div>
            </Tabs>
          </div>
          <DialogFooter>
            <Button loading={saving} type="submit" variant="brand">
              {t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
