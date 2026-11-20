import { ListStyleType } from '@platejs/list'
import { ElementApi, KEYS } from 'platejs'
import { createPlatePlugin } from 'platejs/react'

import { MARKDOWN_SAFE_KEY } from '@/components/ui/rich-text-editor/utils'

const BULLET_STYLES: string[] = [ListStyleType.Circle, ListStyleType.Square, KEYS.listTodo]
const NUMBER_STYLES: string[] = [
  ListStyleType.LowerAlpha,
  ListStyleType.LowerRoman,
  ListStyleType.UpperAlpha,
  ListStyleType.UpperRoman,
]

const markdownListStyle = (style: unknown) => {
  if (typeof style !== 'string') return null
  if (BULLET_STYLES.includes(style)) return ListStyleType.Disc
  if (NUMBER_STYLES.includes(style)) return ListStyleType.Decimal
  return null
}

export const MarkdownSafeKit = [
  createPlatePlugin({ key: MARKDOWN_SAFE_KEY }).overrideEditor(({ editor, tf: { normalizeNode } }) => ({
    transforms: {
      normalizeNode: ([node, path]) => {
        if (ElementApi.isElement(node) && node.indent && !node.listStyleType) {
          editor.tf.unsetNodes('indent', { at: path })
          return
        }
        const listStyleType = ElementApi.isElement(node) ? markdownListStyle(node.listStyleType) : null
        if (listStyleType) {
          editor.tf.unsetNodes('checked', { at: path })
          editor.tf.setNodes({ listStyleType }, { at: path })
          return
        }
        normalizeNode([node, path])
      },
    },
  })),
]
