'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { PlaceholderPlugin } from '@platejs/media/react'
import { AudioLinesIcon, FileUpIcon, FilmIcon, ImageIcon, LinkIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { isUrl, KEYS } from 'platejs'
import { useEditorRef } from 'platejs/react'
import { toast } from 'sonner'
import { useFilePicker } from 'use-file-picker'

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  type DropdownMenuProps,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ToolbarSplitButton, ToolbarSplitButtonPrimary, ToolbarSplitButtonSecondary } from '@/components/ui/toolbar'

interface MediaConfig {
  accept: string[]
  icon: React.ReactNode
  label: string
}

export const MediaToolbarButton = ({
  nodeType,
  tooltip,
  ...props
}: DropdownMenuProps & {
  nodeType: string
  tooltip?: string
}) => {
  const editor = useEditorRef()
  const t = useTranslations('Components.RichTextEditor.media')

  const mediaConfig = useMemo<Record<string, MediaConfig>>(
    () => ({
      [KEYS.audio]: {
        accept: ['audio/*'],
        icon: <AudioLinesIcon className="size-4" />,
        label: t('audio'),
      },
      [KEYS.file]: {
        accept: ['*'],
        icon: <FileUpIcon className="size-4" />,
        label: t('file'),
      },
      [KEYS.img]: {
        accept: ['image/*'],
        icon: <ImageIcon className="size-4" />,
        label: t('image'),
      },
      [KEYS.video]: {
        accept: ['video/*'],
        icon: <FilmIcon className="size-4" />,
        label: t('video'),
      },
    }),
    [t]
  )

  const currentConfig = mediaConfig[nodeType]

  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { openFilePicker } = useFilePicker({
    accept: currentConfig.accept,
    multiple: true,
    onFilesSelected: (data: { plainFiles?: unknown }) => {
      const files = data.plainFiles as FileList
      editor.getTransforms(PlaceholderPlugin).insert.media(files)
    },
  })

  return (
    <>
      <ToolbarSplitButton
        onClick={openFilePicker}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
          }
        }}
        pressed={open}
      >
        <ToolbarSplitButtonPrimary tooltip={tooltip}>{currentConfig.icon}</ToolbarSplitButtonPrimary>

        <DropdownMenu modal={false} onOpenChange={setOpen} open={open} {...props}>
          <DropdownMenuTrigger asChild>
            <ToolbarSplitButtonSecondary />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" alignOffset={-32} onClick={e => e.stopPropagation()}>
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={openFilePicker}>
                {currentConfig.icon}
                {t('upload')} {currentConfig.label.toLowerCase()}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
                <LinkIcon />
                {nodeType === KEYS.video ? t('embedYoutubeVideo') : t('insertUrl')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ToolbarSplitButton>

      <AlertDialog
        onOpenChange={value => {
          setDialogOpen(value)
        }}
        open={dialogOpen}
      >
        <AlertDialogContent className="gap-6">
          <MediaUrlDialogContent currentConfig={currentConfig} nodeType={nodeType} setOpen={setDialogOpen} />
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

const MediaUrlDialogContent = ({
  currentConfig,
  nodeType,
  setOpen,
}: {
  currentConfig: MediaConfig
  nodeType: string
  setOpen: (value: boolean) => void
}) => {
  const editor = useEditorRef()
  const t = useTranslations('Components.RichTextEditor.media')

  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const embedMedia = useCallback(() => {
    if (!isUrl(url)) return toast.error(t('invalidUrl'))

    setOpen(false)

    editor.tf.insertNodes({
      children: [{ text: '' }],
      name: nodeType === KEYS.file ? url.split('/').pop() : undefined,
      type: nodeType,
      url,
    })
  }, [url, editor, nodeType, setOpen, t])

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus()
    })
  }, [])

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{t('insertUrl')}</AlertDialogTitle>
        <AlertDialogDescription>
          {t('insertUrlDescription', { type: currentConfig.label.toLowerCase() })}
        </AlertDialogDescription>
      </AlertDialogHeader>

      {/* <div className="group/input-url relative"> */}
      <Input
        autoFocus
        className="peer w-full"
        icon={LinkIcon}
        id="url"
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') embedMedia()
        }}
        placeholder={t('url')}
        ref={inputRef}
        type="url"
        value={url}
        variant="floating"
      />
      <AlertDialogFooter>
        <AlertDialogCancel>{t('actionCancel')}</AlertDialogCancel>
        <AlertDialogAction
          onClick={e => {
            e.preventDefault()
            embedMedia()
          }}
          variant="brand"
        >
          {t('actionInsert')}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}
