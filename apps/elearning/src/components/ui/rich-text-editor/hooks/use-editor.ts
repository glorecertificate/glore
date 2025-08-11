import { useEditorRef } from 'platejs/react'

import { type Editor } from '@rte/types'

export const useEditor = () => useEditorRef<Editor>()
