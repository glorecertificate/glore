import { type Value, createSlateEditor } from 'platejs'

import { BaseEditorKit } from '@/components/ui/rich-text-editor/plugins/editor-base'

const EMPTY_VALUE = [{ type: 'p', children: [{ text: '' }] }] as Value

const createConverter = () => createSlateEditor({ plugins: BaseEditorKit })

let converter: ReturnType<typeof createConverter> | undefined

export const markdownToArticleValue = (markdown: string) => {
  if (!markdown.trim()) return EMPTY_VALUE
  converter ??= createConverter()
  const value = converter.api.markdown.deserialize(markdown) as Value
  return value.length > 0 ? value : EMPTY_VALUE
}

export const articleValueToMarkdown = (value: Value) => {
  converter ??= createConverter()
  return converter.api.markdown.serialize({ value }).replaceAll('\u200B', '').trim()
}
