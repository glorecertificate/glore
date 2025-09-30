'use client'

import { Plate, usePlateEditor, type PlateProps } from 'platejs/react'

import { PLUGINS } from '../config'
import { useBlockPlaceholderKit } from '../plugins/block-placeholder'
import { type RichTextEditor } from '../types'

export interface EditorProviderProps extends Omit<PlateProps<RichTextEditor>, 'editor'> {
  value?: string
}

export const EditorProvider = ({ value, ...props }: EditorProviderProps) => {
  const BlockPlaceholderPlugin = useBlockPlaceholderKit()
  const plugins = [...PLUGINS, ...BlockPlaceholderPlugin]
  const editor = usePlateEditor({ plugins, value })

  return <Plate {...props} editor={editor} />
}
