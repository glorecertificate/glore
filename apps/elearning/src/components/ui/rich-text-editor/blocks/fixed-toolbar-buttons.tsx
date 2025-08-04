'use client'

import { BaselineIcon, BoldIcon, ItalicIcon, UnderlineIcon, WandSparklesIcon } from 'lucide-react'
import { KEYS } from 'platejs'
import { useEditorReadOnly } from 'platejs/react'

import { useTranslations } from '@/hooks/use-translations'
import { AIToolbarButton } from '#rte/blocks/ai-toolbar-button'
import { AlignToolbarButton } from '#rte/blocks/align-toolbar-button'
import { EmojiToolbarButton } from '#rte/blocks/emoji-toolbar-button'
import { FontColorToolbarButton } from '#rte/blocks/font-color-toolbar-button'
import { RedoToolbarButton, UndoToolbarButton } from '#rte/blocks/history-toolbar-button'
import { InsertToolbarButton } from '#rte/blocks/insert-toolbar-button'
import { LinkToolbarButton } from '#rte/blocks/link-toolbar-button'
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
  TodoListToolbarButton,
} from '#rte/blocks/list-toolbar-button'
import { MarkToolbarButton } from '#rte/blocks/mark-toolbar-button'
import { MediaToolbarButton } from '#rte/blocks/media-toolbar-button'
import { TableToolbarButton } from '#rte/blocks/table-toolbar-button'
import { ToggleToolbarButton } from '#rte/blocks/toggle-toolbar-button'
import { ToolbarGroup } from '#rte/blocks/toolbar'
import { TurnIntoToolbarButton } from '#rte/blocks/turn-into-toolbar-button'

export const FixedToolbarButtons = () => {
  const t = useTranslations('Editor')
  const readOnly = useEditorReadOnly()

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
            <MarkToolbarButton nodeType={KEYS.bold} tooltip={`${t('blocks.bold')} (⌘+B)`}>
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip={`${t('blocks.italic')} (⌘+I)`}>
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.underline} tooltip={`${t('blocks.underline')} (⌘+U)`}>
              <UnderlineIcon />
            </MarkToolbarButton>

            <LinkToolbarButton />

            <FontColorToolbarButton nodeType={KEYS.color} tooltip={t('blocks.textColor')}>
              <BaselineIcon />
            </FontColorToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <AlignToolbarButton />
            <NumberedListToolbarButton tooltip={t('blocks.numberedList')} />
            <BulletedListToolbarButton tooltip={t('blocks.bulletList')} />
            <TodoListToolbarButton />
            <ToggleToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup separator={false}>
            <TableToolbarButton />
            <EmojiToolbarButton />
            <MediaToolbarButton nodeType={KEYS.img} tooltip={t('blocks.image')} />
            <MediaToolbarButton nodeType={KEYS.video} tooltip={t('blocks.video')} />
            <MediaToolbarButton nodeType={KEYS.file} tooltip={t('blocks.file')} />
          </ToolbarGroup>
        </>
      )}
    </div>
  )
}
