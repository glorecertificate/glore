import { useCallback, useMemo } from 'react'

import type { Node } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/react'

import { isUrl } from '@/components/ui/rich-text-editor/utils'

interface UseImageActionsProps {
  editor: Editor
  node: Node
  src: string
  onViewClick: (value: boolean) => void
}

export interface ImageActionHandlers {
  onView?: () => void
  onDownload?: () => void
  onCopy?: () => void
  onCopyLink?: () => void
  onRemoveImg?: () => void
}

export const useImageActions = ({ editor, node, onViewClick, src: initialSrc }: UseImageActionsProps) => {
  const isLink = useMemo(() => isUrl(initialSrc), [initialSrc])

  const onView = useCallback(() => {
    onViewClick(true)
  }, [onViewClick])

  const src = useMemo(() => node.attrs.src as string, [node.attrs.src])
  const alt = useMemo(() => node.attrs.alt as string, [node.attrs.alt])

  const onDownload = useCallback(() => {
    editor.commands.downloadImage({ src, alt })
  }, [editor.commands, src, alt])

  const onCopy = useCallback(() => {
    editor.commands.copyImage({ src })
  }, [editor.commands, src])

  const onCopyLink = useCallback(() => {
    editor.commands.copyLink({ src })
  }, [editor.commands, src])

  const onRemoveImg = useCallback(() => {
    editor.commands.command(({ dispatch, tr }) => {
      const { selection } = tr
      const nodeAtSelection = tr.doc.nodeAt(selection.from)

      if (nodeAtSelection && nodeAtSelection.type.name === 'image') {
        if (dispatch) {
          tr.deleteSelection()
          return true
        }
      }
      return false
    })
  }, [editor.commands])

  return { isLink, onView, onDownload, onCopy, onCopyLink, onRemoveImg }
}
