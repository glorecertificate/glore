'use client'

import { BoldIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon, WandSparklesIcon } from 'lucide-react'
import { KEYS } from 'platejs'
import { useEditorReadOnly } from 'platejs/react'

import { ToolbarGroup } from '@repo/ui/components/toolbar'

import { useI18n } from '../hooks/use-i18n'
import { AIToolbarButton } from './ai-toolbar-button'
import { LinkToolbarButton } from './link-toolbar-button'
import { MarkToolbarButton } from './mark-toolbar-button'
import { TurnIntoToolbarButton } from './turn-into-toolbar-button'

export const FloatingToolbarButtons = () => {
  const { t } = useI18n('ai')
  const readOnly = useEditorReadOnly()

  return (
    <>
      {!readOnly && (
        <>
          <ToolbarGroup>
            <AIToolbarButton size="xs">
              <WandSparklesIcon />
              {t.askAI}
            </AIToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <TurnIntoToolbarButton />

            <MarkToolbarButton nodeType={KEYS.bold} size="xs">
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} size="xs">
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.underline} size="xs">
              <UnderlineIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.strikethrough} size="xs">
              <StrikethroughIcon />
            </MarkToolbarButton>

            <LinkToolbarButton size="xs" />
          </ToolbarGroup>
        </>
      )}
    </>
  )
}
