'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { saveSkillGroup } from '@/actions/courses/skill-groups'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
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
import { Textarea } from '@/components/ui/textarea'
import { type IntlRecord, LOCALES } from '@/lib/i18n'
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
  const { localeItems } = useI18n()
  const { refresh } = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState<IntlRecord>(group?.name ?? emptyRecord())
  const [description, setDescription] = useState<IntlRecord>(group?.description ?? emptyRecord())
  const [icon, setIcon] = useState<string | null>(group?.icon ?? null)

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
      }
      refresh()
    })
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto" size="lg">
        <form className="flex flex-col gap-6" onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{group ? t('editGroup') : t('addGroup')}</DialogTitle>
            <DialogDescription>{group ? `${t('slugLabel')}: ${group.slug}` : t('description')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {localeItems.map(({ label, value }) => (
              <div className="flex flex-col gap-2" key={value}>
                <Label htmlFor={`group-name-${value}`}>{t('nameLabel', { language: label })}</Label>
                <Input
                  id={`group-name-${value}`}
                  maxLength={80}
                  onChange={event => setName(prev => ({ ...prev, [value]: event.target.value }))}
                  required
                  value={name[value]}
                />
              </div>
            ))}
            {localeItems.map(({ label, value }) => (
              <div className="flex flex-col gap-2" key={value}>
                <Label htmlFor={`group-description-${value}`}>{t('descriptionLabel', { language: label })}</Label>
                <Textarea
                  id={`group-description-${value}`}
                  maxLength={300}
                  onChange={event => setDescription(prev => ({ ...prev, [value]: event.target.value }))}
                  value={description[value]}
                />
              </div>
            ))}
            <div className="flex flex-col gap-2">
              <Label>{t('iconLabel')}</Label>
              <IconPicker onValueChange={setIcon} value={(icon ?? undefined) as IconName | undefined}>
                <Button className="w-fit" type="button" variant="outline">
                  {icon && <LucideIcon className="size-4" name={icon as IconName} />}
                  {t('iconChoose')}
                </Button>
              </IconPicker>
            </div>
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
