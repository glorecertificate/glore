'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useCallback, useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { createDocArticle, updateDocArticle } from '@/actions/doc'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { type DocArticle, type DocCategory } from '@/db/queries/doc'
import { type IntlRecord, i18n, intlPlaceholder } from '@/lib/i18n'

interface ArticleEditorProps {
  article?: DocArticle
  categories: DocCategory[]
  defaultCategoryId?: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')

export const ArticleEditor = ({ article, categories, defaultCategoryId, onOpenChange, open }: ArticleEditorProps) => {
  const t = useTranslations('Docs')
  const router = useRouter()

  const [titles, setTitles] = useState<IntlRecord>({ ...intlPlaceholder })
  const [excerpts, setExcerpts] = useState<IntlRecord>({ ...intlPlaceholder })
  const [contents, setContents] = useState<IntlRecord>({ ...intlPlaceholder })
  const [slug, setSlug] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(defaultCategoryId ?? null)
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (article) {
      setTitles({ ...(article.title as IntlRecord) })
      setExcerpts({ ...((article.excerpt as IntlRecord) ?? intlPlaceholder) })
      setContents({ ...(article.content as IntlRecord) })
      setSlug(article.slug)
      setCategoryId(article.categoryId)
      setPublished(article.isPublished)
    } else {
      setTitles({ ...intlPlaceholder })
      setExcerpts({ ...intlPlaceholder })
      setContents({ ...intlPlaceholder })
      setSlug('')
      setCategoryId(defaultCategoryId ?? null)
      setPublished(false)
    }
  }, [article, defaultCategoryId, open])

  const generateSlug = useCallback(() => setSlug(slugify(titles[i18n.defaultLocale] ?? '')), [titles])

  const handleSave = useCallback(async () => {
    if (!titles[i18n.defaultLocale] || !slug) {
      toast.error(t('editor.requiredFields'))
      return
    }
    setSaving(true)
    const payload = {
      title: titles,
      excerpt: excerpts,
      content: contents,
      slug,
      categoryId: categoryId ?? undefined,
      published,
    }
    const { error } = article ? await updateDocArticle(article.id, payload) : await createDocArticle(payload)
    setSaving(false)
    if (error) {
      toast.error(t('editor.error'))
      return
    }
    toast.success(article ? t('editor.updated') : t('editor.created'))
    onOpenChange(false)
    startTransition(() => router.refresh())
  }, [article, categoryId, contents, excerpts, onOpenChange, published, router, slug, t, titles])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{article ? t('editor.editArticle') : t('editor.newArticle')}</DialogTitle>
        </DialogHeader>

        {/* Shared fields */}
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex gap-2 sm:col-span-1">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="article-slug">{t('editor.slug')}</Label>
                <Input
                  id="article-slug"
                  placeholder={t('editor.slugPlaceholder')}
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                />
              </div>
              <div className="mt-auto">
                <Button size="sm" variant="outline" onClick={generateSlug}>
                  {t('editor.generate')}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t('editor.category')}</Label>
              <Select value={categoryId?.toString() ?? ''} onValueChange={v => setCategoryId(v ? Number(v) : null)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.slug}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={published} id="article-published" onCheckedChange={setPublished} />
            <Label htmlFor="article-published">{t('editor.published')}</Label>
          </div>
        </div>

        {/* Per-locale fields */}
        <Tabs defaultValue={i18n.defaultLocale}>
          <TabsList>
            {i18n.localeItems.map(item => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.icon} {item.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {i18n.localeItems.map(item => (
            <TabsContent key={item.value} className="grid gap-4 pt-2" value={item.value}>
              <div className="space-y-1.5">
                <Label>{t('editor.title')}</Label>
                <Input
                  placeholder={t('editor.titlePlaceholder')}
                  value={titles[item.value] ?? ''}
                  onChange={e => setTitles(prev => ({ ...prev, [item.value]: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t('editor.excerpt')}</Label>
                <Textarea
                  className="min-h-20"
                  placeholder={t('editor.excerptPlaceholder')}
                  value={excerpts[item.value] ?? ''}
                  onChange={e => setExcerpts(prev => ({ ...prev, [item.value]: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t('editor.content')}</Label>
                <Textarea
                  className="min-h-40 font-mono text-sm"
                  placeholder={t('editor.contentPlaceholder')}
                  value={contents[item.value] ?? ''}
                  onChange={e => setContents(prev => ({ ...prev, [item.value]: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">{t('editor.markdownSupported')}</p>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('editor.cancel')}
          </Button>
          <Button disabled={saving} onClick={handleSave}>
            {saving ? t('editor.saving') : article ? t('editor.save') : t('editor.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
