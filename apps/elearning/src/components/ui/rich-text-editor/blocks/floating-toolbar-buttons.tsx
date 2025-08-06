'use client'

import { BoldIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon, WandSparklesIcon } from 'lucide-react'
import { KEYS } from 'platejs'
import { useEditorReadOnly } from 'platejs/react'

import { useTranslations } from '@/hooks/use-translations'
import { AIToolbarButton } from '#rte/blocks/ai-toolbar-button'
import { LinkToolbarButton } from '#rte/blocks/link-toolbar-button'
import { MarkToolbarButton } from '#rte/blocks/mark-toolbar-button'
import { ToolbarGroup } from '#rte/blocks/toolbar'
import { TurnIntoToolbarButton } from '#rte/blocks/turn-into-toolbar-button'

export const FloatingToolbarButtons = () => {
  const t = useTranslations('Editor')
  const readOnly = useEditorReadOnly()

  return (
    <>
      {!readOnly && (
        <>
          <ToolbarGroup>
            <AIToolbarButton size="xs">
              <WandSparklesIcon />
              {t('ai.askAI')}
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
