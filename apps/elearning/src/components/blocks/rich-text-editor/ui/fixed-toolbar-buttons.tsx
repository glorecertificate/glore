'use client'

import { BoldIcon, ItalicIcon, UnderlineIcon, WandSparklesIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KEYS } from 'platejs'
import { usePlateState } from 'platejs/react'

import { AIToolbarButton } from '@/components/blocks/rich-text-editor/ui/ai-toolbar-button'
import { AlignToolbarButton } from '@/components/blocks/rich-text-editor/ui/align-toolbar-button'
import { EmojiToolbarButton } from '@/components/blocks/rich-text-editor/ui/emoji-toolbar-button'
import { FontColorToolbarButton } from '@/components/blocks/rich-text-editor/ui/font-color-toolbar-button'
import { RedoToolbarButton, UndoToolbarButton } from '@/components/blocks/rich-text-editor/ui/history-toolbar-button'
import { InsertToolbarButton } from '@/components/blocks/rich-text-editor/ui/insert-toolbar-button'
import { LinkToolbarButton } from '@/components/blocks/rich-text-editor/ui/link-toolbar-button'
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
  TodoListToolbarButton,
} from '@/components/blocks/rich-text-editor/ui/list-toolbar-button'
import { MarkToolbarButton } from '@/components/blocks/rich-text-editor/ui/mark-toolbar-button'
import { MediaToolbarButton } from '@/components/blocks/rich-text-editor/ui/media-toolbar-button'
import { TableToolbarButton } from '@/components/blocks/rich-text-editor/ui/table-toolbar-button'
import { ToggleToolbarButton } from '@/components/blocks/rich-text-editor/ui/toggle-toolbar-button'
import { TurnIntoToolbarButton } from '@/components/blocks/rich-text-editor/ui/turn-into-toolbar-button'
import { ToolbarGroup } from '@/components/ui/toolbar'

export const FixedToolbarButtons = () => {
  const t = useTranslations('Components.RichTextEditor.blocks')
  const [readOnly] = usePlateState('readOnly')

  return (
    <div className="flex w-full">
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
