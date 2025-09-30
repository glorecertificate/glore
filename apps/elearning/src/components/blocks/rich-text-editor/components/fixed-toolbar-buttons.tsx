'use client'

import { BoldIcon, ItalicIcon, UnderlineIcon, WandSparklesIcon } from 'lucide-react'
import { KEYS } from 'platejs'
import { useEditorReadOnly } from 'platejs/react'

import { ToolbarGroup } from '@/components/ui/toolbar'

import { useI18n } from '../hooks/use-i18n'
import { AIToolbarButton } from './ai-toolbar-button'
import { AlignToolbarButton } from './align-toolbar-button'
import { EmojiToolbarButton } from './emoji-toolbar-button'
import { FontColorToolbarButton } from './font-color-toolbar-button'
import { RedoToolbarButton, UndoToolbarButton } from './history-toolbar-button'
import { InsertToolbarButton } from './insert-toolbar-button'
import { LinkToolbarButton } from './link-toolbar-button'
import { BulletedListToolbarButton, NumberedListToolbarButton, TodoListToolbarButton } from './list-toolbar-button'
import { MarkToolbarButton } from './mark-toolbar-button'
import { MediaToolbarButton } from './media-toolbar-button'
import { TableToolbarButton } from './table-toolbar-button'
import { ToggleToolbarButton } from './toggle-toolbar-button'
import { TurnIntoToolbarButton } from './turn-into-toolbar-button'

export const FixedToolbarButtons = () => {
  const { t } = useI18n('blocks')
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
            <AIToolbarButton tooltip={t.aiCommands}>
              <WandSparklesIcon />
            </AIToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <MarkToolbarButton nodeType={KEYS.bold} tooltip={`${t.bold} (⌘+B)`}>
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip={`${t.italic} (⌘+I)`}>
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.underline} tooltip={`${t.underline} (⌘+U)`}>
              <UnderlineIcon />
            </MarkToolbarButton>

            <LinkToolbarButton tooltip={t.link} />

            <FontColorToolbarButton nodeType={KEYS.color} tooltip={t.textColor} />
          </ToolbarGroup>

          <ToolbarGroup>
            <AlignToolbarButton />
            <NumberedListToolbarButton tooltip={t.numberedList} />
            <BulletedListToolbarButton tooltip={t.bulletList} />
            <TodoListToolbarButton />
            <ToggleToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup separator={false}>
            <TableToolbarButton />
            <EmojiToolbarButton />
            <MediaToolbarButton nodeType={KEYS.img} tooltip={t.image} />
            <MediaToolbarButton nodeType={KEYS.video} tooltip={t.video} />
            <MediaToolbarButton nodeType={KEYS.file} tooltip={t.file} />
          </ToolbarGroup>
        </>
      )}
    </div>
  )
}
