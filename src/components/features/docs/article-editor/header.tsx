'use client'

import { type Route } from 'next'
import { useRouter } from 'next/navigation'
import { startTransition, useState } from 'react'

import { useTranslations } from 'next-intl'
import { createPortal } from 'react-dom'

import { deleteDocArticle } from '@/actions/docs'
import { useArticle } from '@/components/features/docs/article-editor/context'
import { ArticleHeading } from '@/components/features/docs/article-editor/heading'
import { ArticleSaveError } from '@/components/features/docs/article-editor/payload'
import { LucideIcon } from '@/components/icons/lucide'
import { DashboardHeader } from '@/components/layout/dashboard-header'
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
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Link } from '@/components/ui/link'
import { StatusBadge } from '@/components/ui/status-badge'
import { toast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMounted } from '@/hooks/use-mounted'
import { DEFAULT_LOCALE } from '@/lib/i18n'

interface ArticleMenuProps {
  onDelete: (() => void) | null
  onUnpublish: (() => void) | null
  previewHref: Route | null
}

const ArticleMenu = ({ onDelete, onUnpublish, previewHref }: ArticleMenuProps) => {
  const t = useTranslations('CourseEditor')
  const tEditor = useTranslations('Docs.editor')

  if (!(onDelete || onUnpublish || previewHref)) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={t('moreActions')} size="icon" variant="band-secondary">
          <LucideIcon name="ellipsis" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        {previewHref && (
          <DropdownMenuItem asChild>
            <Link href={previewHref}>
              <LucideIcon aria-hidden name="eye" />
              {tEditor('preview')}
            </Link>
          </DropdownMenuItem>
        )}
        {onUnpublish && (
          <DropdownMenuItem onSelect={onUnpublish}>
            <LucideIcon aria-hidden name="eye-off" />
            {t('unpublish')}
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem onSelect={onDelete}>
            <LucideIcon aria-hidden name="trash-2" />
            {tEditor('delete')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const ArticleEditorHeader = () => {
  const { push } = useRouter()
  const { localeItems } = useI18n()
  const t = useTranslations('CourseEditor')
  const tEditor = useTranslations('Docs.editor')
  const { article, draft, language, languageStatus, saveArticle, status } = useArticle()
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const mounted = useMounted()

  const isPublished = languageStatus.published
  const publishedLanguageCount = localeItems.filter(({ value }) => status[value].published).length
  const primaryDisabled = isPublished && !languageStatus.hasUpdates
  const draftDisabled = !languageStatus.hasUpdates
  const previewHref = article && !article.isDraft ? (`/docs/articles/${article.slug}?view=reader` as Route) : null

  const stateText = (() => {
    if (saving) return t('saving')
    if (languageStatus.hasUpdates) return t('unsavedChanges')
    if (justSaved) return t('savedJustNow')
    return null
  })()

  const errorMessage = (error: unknown) => {
    const code = error instanceof ArticleSaveError ? error.code : null
    if (code === 'REQUIRED') return tEditor('requiredFields')
    if (code === 'INCOMPLETE') return tEditor('publishIncomplete')
    return tEditor('error')
  }

  const handleSave = async (publish: boolean | null) => {
    try {
      setSaving(publish === null && !isPublished ? 'draft' : 'publish')
      setJustSaved(false)
      await saveArticle({ locale: language, publish })
      setJustSaved(true)
      toast.success(article ? tEditor('updated') : tEditor('created'))
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setSaving(null)
    }
  }

  const onPrimary = () => handleSave(isPublished ? null : true)
  const onSaveDraft = () => handleSave(null)
  const onUnpublish = () => handleSave(false)

  const onDelete = async () => {
    if (!article) return
    const { error } = await deleteDocArticle(article.id)
    if (error) {
      toast.error(tEditor('deleteError'))
      return
    }
    toast.success(tEditor('deleted'))
    startTransition(() => push('/docs'))
  }

  const menu = (
    <ArticleMenu
      onDelete={article ? () => setDeleteOpen(true) : null}
      onUnpublish={isPublished ? onUnpublish : null}
      previewHref={previewHref}
    />
  )

  return (
    <>
      <ArticleHeading>
        {({ description, title }) => (
          <DashboardHeader
            actions={
              <div className="contents max-md:hidden">
                {stateText && (
                  <span aria-live="polite" className="text-sm text-band-text">
                    {stateText}
                  </span>
                )}
                {menu}
                {!isPublished && (
                  <Button
                    disabled={draftDisabled || saving !== null}
                    loading={saving === 'draft'}
                    onClick={onSaveDraft}
                    variant="band-secondary"
                  >
                    {t('saveDraft')}
                  </Button>
                )}
                {primaryDisabled ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button disabled variant="band">
                          {t('publishChanges')}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{t('noChangesToPublish')}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button disabled={saving !== null} loading={saving === 'publish'} onClick={onPrimary} variant="band">
                    {isPublished ? t('publishChanges') : t('publish')}
                  </Button>
                )}
              </div>
            }
            breadcrumb={
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-band-text">
                <StatusBadge tone={isPublished ? 'success' : 'neutral'}>
                  {isPublished ? t('publishSwitchPublished') : t('publishSwitchDraft')}
                </StatusBadge>
                <span>{t('visibleLanguages', { count: publishedLanguageCount })}</span>
                <div className="ml-auto md:hidden">{menu}</div>
              </div>
            }
            description={description}
            heading={title}
            parent="docs"
            title={draft.titles[language] || draft.titles[DEFAULT_LOCALE] || tEditor('newArticle')}
          />
        )}
      </ArticleHeading>
      {mounted &&
        createPortal(
          <section
            aria-label={t('saveBarLabel')}
            className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-page pt-2 pb-bar-safe backdrop-blur-sm md:hidden"
          >
            <div className="flex items-center justify-between gap-3">
              <span aria-live="polite" className="min-w-0 truncate text-sm text-muted-foreground">
                {stateText}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                {!isPublished && (
                  <Button
                    disabled={draftDisabled || saving !== null}
                    loading={saving === 'draft'}
                    onClick={onSaveDraft}
                    variant="outline"
                  >
                    {t('saveDraft')}
                  </Button>
                )}
                <Button
                  disabled={primaryDisabled || saving !== null}
                  loading={saving === 'publish'}
                  onClick={onPrimary}
                  variant="brand"
                >
                  {isPublished ? t('publishChanges') : t('publish')}
                </Button>
              </div>
            </div>
          </section>,
          document.body
        )}
      <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tEditor('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{tEditor('deleteConfirmMessage')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">{tEditor('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>{tEditor('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
