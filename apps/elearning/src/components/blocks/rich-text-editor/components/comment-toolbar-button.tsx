'use client'

import { MessageSquareTextIcon } from 'lucide-react'
import { useEditorRef } from 'platejs/react'

import { ToolbarButton } from '@/components/ui/toolbar'

import { useI18n } from '../hooks/use-i18n'
import { commentPlugin } from '../plugins/comment'

export const CommentToolbarButton = () => {
  const editor = useEditorRef()
  const { t } = useI18n('blocks')

  return (
    <ToolbarButton
      data-plate-prevent-overlay
      onClick={() => editor.getTransforms(commentPlugin).comment.setDraft()}
      tooltip={t.comment}
    >
      <MessageSquareTextIcon />
    </ToolbarButton>
  )
}
