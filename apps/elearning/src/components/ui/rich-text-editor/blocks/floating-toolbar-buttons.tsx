'use client'

import { BoldIcon, Code2Icon, ItalicIcon, StrikethroughIcon, UnderlineIcon, WandSparklesIcon } from 'lucide-react'
import { KEYS } from 'platejs'
import { useEditorReadOnly } from 'platejs/react'

import { useTranslations } from '@/hooks/use-translations'
import { AIToolbarButton } from '#rte/blocks/ai-toolbar-button'
import { CommentToolbarButton } from '#rte/blocks/comment-toolbar-button'
import { InlineEquationToolbarButton } from '#rte/blocks/equation-toolbar-button'
import { LinkToolbarButton } from '#rte/blocks/link-toolbar-button'
import { MarkToolbarButton } from '#rte/blocks/mark-toolbar-button'
import { MoreToolbarButton } from '#rte/blocks/more-toolbar-button'
import { SuggestionToolbarButton } from '#rte/blocks/suggestion-toolbar-button'
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
            <AIToolbarButton tooltip={t('aiCommands')}>
              <WandSparklesIcon />
              {t('ai.askAI')}
            </AIToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <TurnIntoToolbarButton />

            <MarkToolbarButton nodeType={KEYS.bold} tooltip={`${t('blocks.bold')} (⌘+B)`}>
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip={`${t('blocks.italic')} (⌘+I)`}>
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.underline} tooltip={`${t('blocks.underline')} (⌘+U)`}>
              <UnderlineIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.strikethrough} tooltip={`${t('blocks.strikethrough')} (⌘+⇧+M)`}>
              <StrikethroughIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.code} tooltip={`${t('blocks.code')} (⌘+E)`}>
              <Code2Icon />
            </MarkToolbarButton>

            <InlineEquationToolbarButton />

            <LinkToolbarButton />
          </ToolbarGroup>
        </>
      )}

      <ToolbarGroup>
        <CommentToolbarButton />
        <SuggestionToolbarButton />

        {!readOnly && <MoreToolbarButton />}
      </ToolbarGroup>
    </>
  )
}
