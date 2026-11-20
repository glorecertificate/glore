'use client'

import { useTranslations } from 'next-intl'

import { useArticle } from '@/components/features/docs/article-editor/context'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DOC_AUDIENCES } from '@/db/queries/doc'
import { type IntlRecord } from '@/lib/i18n'

export const ArticleSettings = () => {
  const t = useTranslations('Docs.editor')
  const tAudience = useTranslations('Docs.audience')
  const tRoles = useTranslations('Help.roles')
  const { localize } = useI18n()
  const { categories, draft, generateSlug, setCategory, setSlug, toggleAudience } = useArticle()

  return (
    <section
      aria-label={t('settings')}
      className="mb-4 grid gap-4 rounded-xl border border-border-subtle bg-card p-4 shadow-card sm:grid-cols-2"
    >
      <div className="flex items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Label htmlFor="article-slug">{t('slug')}</Label>
          <Input
            id="article-slug"
            onChange={event => setSlug(event.target.value)}
            placeholder={t('slugPlaceholder')}
            value={draft.slug}
          />
        </div>
        <Button onClick={generateSlug} variant="outline">
          {t('generate')}
        </Button>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor="article-category">{t('category')}</Label>
        <Select
          onValueChange={value => setCategory(value ? Number(value) : null)}
          value={draft.categoryId?.toString() ?? ''}
        >
          <SelectTrigger id="article-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {localize(category.title as IntlRecord)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <fieldset aria-describedby="article-audience-hint" className="flex min-w-0 flex-col gap-2 sm:col-span-2">
        <legend className="mb-2 text-sm leading-none font-medium">{tAudience('label')}</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {DOC_AUDIENCES.map(audience => (
            <div className="flex items-center gap-2" key={audience}>
              <Checkbox
                checked={draft.audiences.includes(audience)}
                id={`article-audience-${audience}`}
                onCheckedChange={checked => toggleAudience(audience, checked === true)}
              />
              <Label className="font-normal" htmlFor={`article-audience-${audience}`}>
                {tRoles(`${audience}.label`)}
              </Label>
            </div>
          ))}
        </div>
        <p className="text-sm text-fg-2" id="article-audience-hint">
          {tAudience('hint')}
        </p>
      </fieldset>
    </section>
  )
}
