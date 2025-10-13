'use client'

import { BoldIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon, WandSparklesIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KEYS } from 'platejs'
import { useEditorReadOnly } from 'platejs/react'

import { AIToolbarButton } from '@/components/blocks/rich-text-editor/ui/ai-toolbar-button'
import { LinkToolbarButton } from '@/components/blocks/rich-text-editor/ui/link-toolbar-button'
import { MarkToolbarButton } from '@/components/blocks/rich-text-editor/ui/mark-toolbar-button'
import { TurnIntoToolbarButton } from '@/components/blocks/rich-text-editor/ui/turn-into-toolbar-button'
import { ToolbarGroup } from '@/components/ui/toolbar'

export const FloatingToolbarButtons = () => {
  const t = useTranslations('Editor.ai')
  const readOnly = useEditorReadOnly()

  return (
    <>
      {!readOnly && (
        <>
          <ToolbarGroup>
            <AIToolbarButton size="xs">
              <WandSparklesIcon />
              {t('askAI')}
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
