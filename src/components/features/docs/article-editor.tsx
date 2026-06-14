'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useEffect, useReducer } from 'react'

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
import { DEFAULT_LOCALE, INTL_PLACEHOLDER, type IntlRecord, LOCALE_ITEMS } from '@/lib/i18n'

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
    .replace(/[^a-z0-9\s-]/gu, '')
    .replace(/\s+/gu, '-')
    .replace(/-{2,}/gu, '-')
    .replace(/^-|-$/gu, '')

interface EditorState {
  titles: IntlRecord
  excerpts: IntlRecord
  contents: IntlRecord
  slug: string
  categoryId: number | null
  published: boolean
  saving: boolean
}

type EditorAction =
  | { type: 'INIT_ARTICLE'; article: DocArticle }
  | { type: 'INIT_NEW'; defaultCategoryId?: number }
  | { type: 'SET_LOCALE_FIELD'; field: 'contents' | 'excerpts' | 'titles'; locale: string; value: string }
  | { type: 'SET_CATEGORY'; value: number | null }
  | { type: 'SET_PUBLISHED'; value: boolean }
  | { type: 'SET_SAVING'; value: boolean }
  | { type: 'SET_SLUG'; value: string }

const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
  if (action.type === 'INIT_ARTICLE') {
    return {
      titles: { ...(action.article.title as IntlRecord) },
      excerpts: { ...((action.article.excerpt as IntlRecord) ?? INTL_PLACEHOLDER) },
      contents: { ...(action.article.content as IntlRecord) },
      slug: action.article.slug,
      categoryId: action.article.categoryId,
      published: action.article.isPublished,
      saving: false,
    }
  }
  if (action.type === 'INIT_NEW') {
    return {
      titles: { ...INTL_PLACEHOLDER },
      excerpts: { ...INTL_PLACEHOLDER },
      contents: { ...INTL_PLACEHOLDER },
      slug: '',
      categoryId: action.defaultCategoryId ?? null,
      published: false,
      saving: false,
    }
  }
  if (action.type === 'SET_LOCALE_FIELD') {
    return { ...state, [action.field]: { ...state[action.field], [action.locale]: action.value } }
  }
  if (action.type === 'SET_CATEGORY') return { ...state, categoryId: action.value }
  if (action.type === 'SET_PUBLISHED') return { ...state, published: action.value }
  if (action.type === 'SET_SAVING') return { ...state, saving: action.value }
  if (action.type === 'SET_SLUG') return { ...state, slug: action.value }
  return state
}

export const ArticleEditor = ({ article, categories, defaultCategoryId, onOpenChange, open }: ArticleEditorProps) => {
  const t = useTranslations('Docs')
  const { refresh: routerRefresh } = useRouter()

  const [state, dispatch] = useReducer(editorReducer, {
    titles: { ...INTL_PLACEHOLDER },
    excerpts: { ...INTL_PLACEHOLDER },
    contents: { ...INTL_PLACEHOLDER },
    slug: '',
    categoryId: defaultCategoryId ?? null,
    published: false,
    saving: false,
  })

  const { categoryId, contents, excerpts, published, saving, slug, titles } = state

  useEffect(() => {
    if (!open) return
    if (article) {
      dispatch({ type: 'INIT_ARTICLE', article })
    } else {
      dispatch({ type: 'INIT_NEW', defaultCategoryId })
    }
  }, [article, defaultCategoryId, open])

  const generateSlug = () => dispatch({ type: 'SET_SLUG', value: slugify(titles[DEFAULT_LOCALE] ?? '') })

  const handleSave = async () => {
    if (!titles[DEFAULT_LOCALE] || !slug) {
      toast.error(t('editor.requiredFields'))
      return
    }
    dispatch({ type: 'SET_SAVING', value: true })
    const payload = {
      title: titles,
      excerpt: excerpts,
      content: contents,
      slug,
      categoryId: categoryId ?? undefined,
      published,
    }
    const { error } = article ? await updateDocArticle(article.id, payload) : await createDocArticle(payload)
    dispatch({ type: 'SET_SAVING', value: false })
    if (error) {
      toast.error(t('editor.error'))
      return
    }
    toast.success(article ? t('editor.updated') : t('editor.created'))
    onOpenChange(false)
    startTransition(() => routerRefresh())
  }

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
                  onChange={e => dispatch({ type: 'SET_SLUG', value: e.target.value })}
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
              <Select
                value={categoryId?.toString() ?? ''}
                onValueChange={v => dispatch({ type: 'SET_CATEGORY', value: v ? Number(v) : null })}
              >
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
            <Switch
              checked={published}
              id="article-published"
              onCheckedChange={value => dispatch({ type: 'SET_PUBLISHED', value })}
            />
            <Label htmlFor="article-published">{t('editor.published')}</Label>
          </div>
        </div>

        {/* Per-locale fields */}
        <Tabs defaultValue={DEFAULT_LOCALE}>
          <TabsList>
            {LOCALE_ITEMS.map(item => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.icon} {item.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {LOCALE_ITEMS.map(item => (
            <TabsContent key={item.value} className="grid gap-4 pt-2" value={item.value}>
              <div className="space-y-1.5">
                <Label>{t('editor.title')}</Label>
                <Input
                  placeholder={t('editor.titlePlaceholder')}
                  value={titles[item.value] ?? ''}
                  onChange={e =>
                    dispatch({ type: 'SET_LOCALE_FIELD', field: 'titles', locale: item.value, value: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t('editor.excerpt')}</Label>
                <Textarea
                  className="min-h-20"
                  placeholder={t('editor.excerptPlaceholder')}
                  value={excerpts[item.value] ?? ''}
                  onChange={e =>
                    dispatch({ type: 'SET_LOCALE_FIELD', field: 'excerpts', locale: item.value, value: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t('editor.content')}</Label>
                <Textarea
                  className="min-h-40 font-mono text-sm"
                  placeholder={t('editor.contentPlaceholder')}
                  value={contents[item.value] ?? ''}
                  onChange={e =>
                    dispatch({ type: 'SET_LOCALE_FIELD', field: 'contents', locale: item.value, value: e.target.value })
                  }
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
