'use client'

import { useState } from 'react'

import { KeyboardIcon, MoreHorizontalIcon, SubscriptIcon, SuperscriptIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KEYS } from 'platejs'
import { useEditorRef } from 'platejs/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  type DropdownMenuProps,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToolbarButton } from '@/components/ui/toolbar'

export const MoreToolbarButton = (props: DropdownMenuProps) => {
  const editor = useEditorRef()
  const t = useTranslations('Components.RichTextEditor.actions')

  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu modal={false} onOpenChange={setOpen} open={open} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Insert">
          <MoreHorizontalIcon />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="ignore-click-outside/toolbar flex max-h-[500px] min-w-[180px] flex-col overflow-y-auto"
      >
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              editor.tf.toggleMark(KEYS.kbd)
              editor.tf.collapse({ edge: 'end' })
              editor.tf.focus()
            }}
          >
            <KeyboardIcon />
            {t('keyboardInput')}
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => {
              editor.tf.toggleMark(KEYS.sup, {
                remove: KEYS.sub,
              })
              editor.tf.focus()
            }}
          >
            <SuperscriptIcon />
            {t('superscript')}
            {/* (⌘+,) */}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              editor.tf.toggleMark(KEYS.sub, {
                remove: KEYS.sup,
              })
              editor.tf.focus()
            }}
          >
            <SubscriptIcon />
            {t('subscript')}
            {/* (⌘+.) */}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
