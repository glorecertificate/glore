'use client'

import { MessageSquareTextIcon } from 'lucide-react'
import { useEditorRef } from 'platejs/react'

import { useTranslations } from '@/hooks/use-translations'
import { ToolbarButton } from '#rte/blocks/toolbar'
import { commentPlugin } from '#rte/kits/comment'

export const CommentToolbarButton = () => {
  const editor = useEditorRef()
  const t = useTranslations('Editor')

  return (
    <ToolbarButton
      data-plate-prevent-overlay
      onClick={() => editor.getTransforms(commentPlugin).comment.setDraft()}
      tooltip={t('blocks.comment')}
    >
      <MessageSquareTextIcon />
    </ToolbarButton>
  )
}
