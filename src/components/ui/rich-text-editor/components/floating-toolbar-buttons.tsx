'use client'

import { BoldIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon, WandSparklesIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KEYS } from 'platejs'
import { useEditorRef, usePlateState } from 'platejs/react'

import { AIToolbarButton } from '@/components/ui/rich-text-editor/components/ai-toolbar-button'
import { LinkToolbarButton } from '@/components/ui/rich-text-editor/components/link-toolbar-button'
import { MarkToolbarButton } from '@/components/ui/rich-text-editor/components/mark-toolbar-button'
import { TurnIntoToolbarButton } from '@/components/ui/rich-text-editor/components/turn-into-toolbar-button'
import { hasPlugin } from '@/components/ui/rich-text-editor/utils'
import { ToolbarGroup } from '@/components/ui/toolbar'

export const FloatingToolbarButtons = () => {
  const t = useTranslations('Components.RichTextEditor.ai')
  const editor = useEditorRef()
  const [readOnly] = usePlateState('readOnly')

  if (readOnly) return null

  return (
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

        {hasPlugin(editor, KEYS.underline) && (
          <MarkToolbarButton nodeType={KEYS.underline} size="xs">
            <UnderlineIcon />
          </MarkToolbarButton>
        )}

        <MarkToolbarButton nodeType={KEYS.strikethrough} size="xs">
          <StrikethroughIcon />
        </MarkToolbarButton>

        <LinkToolbarButton size="xs" />
      </ToolbarGroup>
    </>
  )
}
