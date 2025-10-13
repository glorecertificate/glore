'use client'

import { getCommentCount } from '@platejs/comment'
import { type TCommentText } from 'platejs'
import { PlateLeaf, type PlateLeafProps, useEditorPlugin, usePluginOption } from 'platejs/react'

import { cn } from '@/lib/utils'
import { commentPlugin } from '../plugins/comment'

export const CommentLeaf = (props: PlateLeafProps<TCommentText>) => {
  const { leaf } = props

  const { api, setOption } = useEditorPlugin(commentPlugin)
  const hoverId = usePluginOption(commentPlugin, 'hoverId')
  const activeId = usePluginOption(commentPlugin, 'activeId')

  const isOverlapping = getCommentCount(leaf) > 1
  const currentId = api.comment.nodeId(leaf)
  const isActive = activeId === currentId
  const isHover = hoverId === currentId

  return (
    <PlateLeaf
      {...props}
      attributes={{
        ...props.attributes,
        onClick: () => setOption('activeId', currentId ?? null),
        onMouseEnter: () => setOption('hoverId', currentId ?? null),
        onMouseLeave: () => setOption('hoverId', null),
      }}
      className={cn(
        'border-b-2 border-b-editor-highlight/[.36] bg-editor-highlight/[.13] transition-colors duration-200',
        (isHover || isActive) && 'border-b-editor-highlight bg-editor-highlight/25',
        isOverlapping && 'border-b-2 border-b-editor-highlight/[.7] bg-editor-highlight/25',
        (isHover || isActive) && isOverlapping && 'border-b-editor-highlight bg-editor-highlight/45'
      )}
    >
      {props.children}
    </PlateLeaf>
  )
}
