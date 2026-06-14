'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'

import { FolderOpenIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { createDocCategory, deleteDocCategory } from '@/actions/doc'
import { useI18n } from '@/components/providers/i18n'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { type DocCategory } from '@/db/queries/doc'
import { DEFAULT_LOCALE, INTL_PLACEHOLDER, type IntlRecord, LOCALE_ITEMS } from '@/lib/i18n'

interface CategoryManagerProps {
  categories: DocCategory[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CategoryManager = ({ categories, onOpenChange, open }: CategoryManagerProps) => {
  const t = useTranslations('Docs')
  const { refresh } = useRouter()
  const { localize } = useI18n()

  const [names, setNames] = useState<IntlRecord>({ ...INTL_PLACEHOLDER })
  const [descriptions, setDescriptions] = useState<IntlRecord>({ ...INTL_PLACEHOLDER })
  const [slug, setSlug] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!names[DEFAULT_LOCALE] || !slug) {
      toast.error(t('categories.requiredFields'))
      return
    }
    setAdding(true)
    const { error } = await createDocCategory({ title: names, description: descriptions, slug })
    setAdding(false)
    if (error) {
      toast.error(t('categories.error'))
      return
    }
    toast.success(t('categories.created'))
    setNames({ ...INTL_PLACEHOLDER })
    setDescriptions({ ...INTL_PLACEHOLDER })
    setSlug('')
    startTransition(() => refresh())
  }

  const handleDelete = async (id: number) => {
    const { error } = await deleteDocCategory(id)
    if (error) {
      toast.error(t('categories.error'))
      return
    }
    toast.success(t('categories.deleted'))
    startTransition(() => refresh())
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t('categories.manage')}</SheetTitle>
        </SheetHeader>

        {/* Existing categories */}
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium">{t('categories.existing')}</p>
          {categories.length === 0 ? (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderOpenIcon />
                </EmptyMedia>
                <EmptyTitle>{t('categories.empty')}</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="divide-y rounded-md border">
              {categories.map(cat => (
                <li key={cat.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{localize(cat.title as IntlRecord)}</p>
                    <p className="truncate text-xs text-muted-foreground">{cat.slug}</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="shrink-0 text-destructive hover:text-destructive" size="icon" variant="ghost">
                        <Trash2Icon className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('categories.deleteConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('categories.deleteConfirmMessage')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('editor.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(cat.id)}>
                          {t('categories.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Separator className="my-5" />

        {/* Add new category */}
        <div className="space-y-4">
          <p className="text-sm font-medium">{t('categories.addNew')}</p>

          <div className="space-y-1.5">
            <Label htmlFor="cat-slug">{'Slug'}</Label>
            <Input id="cat-slug" placeholder="category-slug" value={slug} onChange={e => setSlug(e.target.value)} />
          </div>

          <Tabs defaultValue={DEFAULT_LOCALE}>
            <TabsList>
              {LOCALE_ITEMS.map(item => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.icon} {item.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {LOCALE_ITEMS.map(item => (
              <TabsContent key={item.value} className="grid gap-3 pt-2" value={item.value}>
                <div className="space-y-1.5">
                  <Label>{t('categories.name')}</Label>
                  <Input
                    placeholder={t('categories.namePlaceholder')}
                    value={names[item.value] ?? ''}
                    onChange={e => setNames(prev => ({ ...prev, [item.value]: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('categories.description')}</Label>
                  <Textarea
                    placeholder={t('categories.descriptionPlaceholder')}
                    value={descriptions[item.value] ?? ''}
                    onChange={e => setDescriptions(prev => ({ ...prev, [item.value]: e.target.value }))}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <Button className="w-full" disabled={adding} size="sm" onClick={handleAdd}>
            <PlusIcon className="size-4" />
            {t('categories.add')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
