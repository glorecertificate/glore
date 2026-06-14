'use client'

import { BoldIcon, ItalicIcon, UnderlineIcon, WandSparklesIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KEYS } from 'platejs'
import { usePlateState } from 'platejs/react'

import { AIToolbarButton } from '@/components/ui/rich-text-editor/components/ai-toolbar-button'
import { AlignToolbarButton } from '@/components/ui/rich-text-editor/components/align-toolbar-button'
import { EmojiToolbarButton } from '@/components/ui/rich-text-editor/components/emoji-toolbar-button'
import { FontColorToolbarButton } from '@/components/ui/rich-text-editor/components/font-color-toolbar-button'
import {
  RedoToolbarButton,
  UndoToolbarButton,
} from '@/components/ui/rich-text-editor/components/history-toolbar-button'
import { InsertToolbarButton } from '@/components/ui/rich-text-editor/components/insert-toolbar-button'
import { LinkToolbarButton } from '@/components/ui/rich-text-editor/components/link-toolbar-button'
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
  TodoListToolbarButton,
} from '@/components/ui/rich-text-editor/components/list-toolbar-button'
import { MarkToolbarButton } from '@/components/ui/rich-text-editor/components/mark-toolbar-button'
import { MediaToolbarButton } from '@/components/ui/rich-text-editor/components/media-toolbar-button'
import { TableToolbarButton } from '@/components/ui/rich-text-editor/components/table-toolbar-button'
import { ToggleToolbarButton } from '@/components/ui/rich-text-editor/components/toggle-toolbar-button'
import { TurnIntoToolbarButton } from '@/components/ui/rich-text-editor/components/turn-into-toolbar-button'
import { ToolbarGroup } from '@/components/ui/toolbar'

export const FixedToolbarButtons = () => {
  const t = useTranslations('Components.RichTextEditor.blocks')
  const [readOnly] = usePlateState('readOnly')

  return (
    <div className="flex w-full flex-wrap gap-2 lg:gap-1">
      {!readOnly && (
        <>
          <ToolbarGroup>
            <UndoToolbarButton />
            <RedoToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <InsertToolbarButton />
            <TurnIntoToolbarButton />
            <AIToolbarButton tooltip={t('aiCommands')}>
              <WandSparklesIcon />
            </AIToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <MarkToolbarButton nodeType={KEYS.bold} tooltip={`${t('bold')} (⌘+B)`}>
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip={`${t('italic')} (⌘+I)`}>
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.underline} tooltip={`${t('underline')} (⌘+U)`}>
              <UnderlineIcon />
            </MarkToolbarButton>

            <LinkToolbarButton tooltip={t('link')} />

            <FontColorToolbarButton nodeType={KEYS.color} tooltip={t('textColor')} />
          </ToolbarGroup>

          <ToolbarGroup>
            <AlignToolbarButton />
            <NumberedListToolbarButton tooltip={t('numberedList')} />
            <BulletedListToolbarButton tooltip={t('bulletList')} />
            <TodoListToolbarButton />
            <ToggleToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup separator={false}>
            <TableToolbarButton />
            <EmojiToolbarButton />
            <MediaToolbarButton nodeType={KEYS.img} tooltip={t('image')} />
            <MediaToolbarButton nodeType={KEYS.video} tooltip={t('video')} />
            <MediaToolbarButton nodeType={KEYS.file} tooltip={t('file')} />
          </ToolbarGroup>
        </>
      )}
    </div>
  )
}
