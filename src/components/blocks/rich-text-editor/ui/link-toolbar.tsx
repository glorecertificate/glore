'use client'

import { useMemo } from 'react'

import { flip, offset, type UseVirtualFloatingOptions } from '@platejs/floating'
import { getLinkAttributes } from '@platejs/link'
import {
  FloatingLinkUrlInput,
  type LinkFloatingToolbarState,
  useFloatingLinkEdit,
  useFloatingLinkEditState,
  useFloatingLinkInsert,
  useFloatingLinkInsertState,
} from '@platejs/link/react'
import { cva } from 'class-variance-authority'
import { ExternalLinkIcon, LinkIcon, TextIcon, UnlinkIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KEYS, type TLinkElement } from 'platejs'
import { useEditorRef, useEditorSelection, useFormInputProps, usePluginOption } from 'platejs/react'

import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const popoverVariants = cva(
  'z-50 w-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-hidden'
)

const inputVariants = cva(
  `
    flex h-7 w-full rounded-md border-none bg-transparent px-1.5 py-1 text-base
    placeholder:text-muted-foreground
    focus-visible:ring-transparent focus-visible:outline-none
    md:text-sm
  `
)

export const LinkFloatingToolbar = ({ state }: { state?: LinkFloatingToolbarState }) => {
  const t = useTranslations('Components.RichTextEditor.media')
  const activeCommentId = usePluginOption({ key: KEYS.comment }, 'activeId') as string | undefined
  const activeSuggestionId = usePluginOption({ key: KEYS.suggestion }, 'activeId') as string | undefined

  const floatingOptions: UseVirtualFloatingOptions = useMemo(
    () => ({
      middleware: [
        offset(8),
        flip({
          fallbackPlacements: ['bottom-end', 'top-start', 'top-end'],
          padding: 12,
        }),
      ],
      placement: activeSuggestionId || activeCommentId ? 'top-start' : 'bottom-start',
    }),
    [activeCommentId, activeSuggestionId]
  )

  const insertState = useFloatingLinkInsertState({
    ...state,
    floatingOptions: {
      ...floatingOptions,
      ...state?.floatingOptions,
    },
  })
  const { hidden, props: insertProps, ref: insertRef, textInputProps } = useFloatingLinkInsert(insertState)

  const editState = useFloatingLinkEditState({
    ...state,
    floatingOptions: {
      ...floatingOptions,
      ...state?.floatingOptions,
    },
  })
  const { editButtonProps, props: editProps, ref: editRef, unlinkButtonProps } = useFloatingLinkEdit(editState)
  const inputProps = useFormInputProps({
    preventDefaultOnEnterKeydown: true,
  })

  if (hidden) return null

  const input = (
    <div className="flex w-[330px] flex-col" {...inputProps}>
      <div className="flex items-center">
        <div className="flex items-center pr-1 pl-2 text-muted-foreground">
          <LinkIcon className="size-4" />
        </div>

        <FloatingLinkUrlInput className={inputVariants()} data-plate-focus placeholder="Paste link" />
      </div>
      <Separator className="my-1" />
      <div className="flex items-center">
        <div className="flex items-center pr-1 pl-2 text-muted-foreground">
          <TextIcon className="size-4" />
        </div>
        <input className={inputVariants()} data-plate-focus placeholder="TextIcon to display" {...textInputProps} />
      </div>
    </div>
  )

  const editContent = editState.isEditing ? (
    input
  ) : (
    <div className="box-content flex items-center">
      <button className={buttonVariants({ size: 'sm', variant: 'ghost' })} type="button" {...editButtonProps}>
        {t('editLink')}
      </button>

      <Separator orientation="vertical" />

      <LinkOpenButton />

      <Separator orientation="vertical" />

      <button
        className={buttonVariants({
          size: 'sm',
          variant: 'ghost',
        })}
        type="button"
        {...unlinkButtonProps}
      >
        <UnlinkIcon width={18} />
      </button>
    </div>
  )

  return (
    <>
      <div className={popoverVariants()} ref={insertRef} {...(insertProps as React.HTMLAttributes<HTMLDivElement>)}>
        {input}
      </div>
      <div className={popoverVariants()} ref={editRef} {...(editProps as React.HTMLAttributes<HTMLDivElement>)}>
        {editContent}
      </div>
    </>
  )
}

const LinkOpenButton = () => {
  const editor = useEditorRef()
  const _selection = useEditorSelection() as string | undefined

  const attributes = useMemo(() => {
    const entry = editor.api.node<TLinkElement>({
      match: { type: editor.getType(KEYS.link) },
    })
    if (!entry) {
      return {}
    }
    const [element] = entry
    return getLinkAttributes(editor, element)
  }, [editor])

  return (
    <a
      {...attributes}
      className={buttonVariants({
        size: 'sm',
        variant: 'ghost',
      })}
      href={attributes.href || _selection}
      onFocus={e => {
        e.stopPropagation()
      }}
      onMouseOver={e => {
        e.stopPropagation()
      }}
      rel="noreferrer"
      target="_blank"
    >
      <ExternalLinkIcon width={18} />
    </a>
  )
}
