import { type TElement, type Value, createSlateEditor } from 'platejs'

import { BaseEditorKit } from '@/components/ui/rich-text-editor/plugins/editor-base'

const EMPTY_VALUE = [{ type: 'p', children: [{ text: '' }] }] as Value

const createConverter = () => createSlateEditor({ plugins: BaseEditorKit })

let converter: ReturnType<typeof createConverter> | undefined

const CELLS = new Set(['td', 'th'])

const flattenCells = (nodes: TElement[]): TElement[] =>
  nodes.map(node => {
    if (CELLS.has(node.type as string) && node.children.length > 1) {
      const inline = (node.children as TElement[]).flatMap((block, index) => [
        ...(index > 0 ? [{ text: ' ' }] : []),
        ...(block.children ?? [block]),
      ])
      return { ...node, children: [{ children: inline, type: 'p' }] } as TElement
    }
    if (!Array.isArray(node.children) || !node.children.some(child => 'children' in child)) return node
    return { ...node, children: flattenCells(node.children as TElement[]) } as TElement
  })

export const markdownToArticleValue = (markdown: string) => {
  if (!markdown.trim()) return EMPTY_VALUE
  converter ??= createConverter()
  const value = converter.api.markdown.deserialize(markdown) as Value
  return value.length > 0 ? value : EMPTY_VALUE
}

export const articleValueToMarkdown = (value: Value) => {
  converter ??= createConverter()
  return converter.api.markdown
    .serialize({ value: flattenCells(value as TElement[]) as Value })
    .replaceAll('\u200B', '')
    .trim()
}
