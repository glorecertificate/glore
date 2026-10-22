import {
  BaseBlockquotePlugin,
  BaseBoldPlugin,
  BaseH2Plugin,
  BaseH3Plugin,
  BaseH4Plugin,
  BaseHorizontalRulePlugin,
  BaseItalicPlugin,
  BaseStrikethroughPlugin,
} from '@platejs/basic-nodes'
import { BaseIndentPlugin } from '@platejs/indent'
import { BaseLinkPlugin } from '@platejs/link'
import { BaseListPlugin } from '@platejs/list'
import { MarkdownPlugin } from '@platejs/markdown'
import { BaseTableCellHeaderPlugin, BaseTableCellPlugin, BaseTablePlugin, BaseTableRowPlugin } from '@platejs/table'
import { KEYS, type Value, createSlateEditor } from 'platejs'
import remarkGfm from 'remark-gfm'

interface PlateNode {
  type?: string
  text?: string
  url?: string
  listStyleType?: string
  children?: PlateNode[]
  [mark: string]: unknown
}

const BLOCK_TYPES = new Set(['p', 'h2', 'h3', 'h4', 'blockquote', 'hr', 'a', 'table', 'tr', 'td', 'th'])
const LIST_STYLES = new Set(['disc', 'decimal'])
const MARKS = new Set(['bold', 'italic', 'strikethrough'])
const NODE_KEYS = new Set(['children', 'type', 'url', 'indent', 'listStyleType', 'listStart', 'text', ...MARKS])
const LINK_REGEX = /^(https?:\/\/|mailto:)/iu
const DOC_LINK_REGEX = /^(https?:\/\/|mailto:|\/(?!\/))/iu
const TABLE_TYPES = new Set(['table', 'tr', 'td', 'th'])
const HTML_REGEX = /<\/?[a-z][^<>]*>/iu

const createEditor = () => {
  const targetPlugins = [...KEYS.heading, KEYS.p, KEYS.blockquote]
  return createSlateEditor({
    plugins: [
      BaseH2Plugin,
      BaseH3Plugin,
      BaseH4Plugin,
      BaseBlockquotePlugin,
      BaseHorizontalRulePlugin,
      BaseBoldPlugin,
      BaseItalicPlugin,
      BaseStrikethroughPlugin,
      BaseIndentPlugin.configure({ inject: { targetPlugins } }),
      BaseListPlugin.configure({ inject: { targetPlugins } }),
      BaseLinkPlugin,
      BaseTablePlugin,
      BaseTableRowPlugin,
      BaseTableCellPlugin,
      BaseTableCellHeaderPlugin,
      MarkdownPlugin.configure({ options: { remarkPlugins: [remarkGfm] } }),
    ],
  })
}

let editor: ReturnType<typeof createEditor> | undefined

const flattenBlockquote = (node: PlateNode): PlateNode => {
  const children = node.children ?? []
  if (!children.every(child => child.type === 'p')) return node
  const inline = children.flatMap((child, index) => [...(index > 0 ? [{ text: '\n' }] : []), ...(child.children ?? [])])
  return { ...node, children: inline }
}

const normalize = (node: PlateNode): PlateNode => {
  const children = node.children?.map(normalize)
  const next = children ? { ...node, children } : node
  return next.type === 'blockquote' ? flattenBlockquote(next) : next
}

export const markdownToPlate = (markdown: string) => {
  editor ??= createEditor()
  const value = editor.api.markdown.deserialize(markdown) as PlateNode[]
  return value.map(normalize) as unknown as Value
}

export interface InspectOptions {
  docs?: boolean
}

interface InspectContext {
  problems: Set<string>
  options: InspectOptions
}

const inspect = (node: PlateNode, { options, problems }: InspectContext, insideBlockquote = false) => {
  for (const key of Object.keys(node)) {
    if (!NODE_KEYS.has(key)) problems.add(key === 'code' ? 'inline code' : `unsupported attribute "${key}"`)
  }
  if (options.docs && node.strikethrough) problems.add('strikethrough (the docs page does not render it)')

  if (typeof node.text === 'string') {
    if (node.text.includes('\n') && !(insideBlockquote && node.text === '\n')) {
      problems.add('a line break inside a paragraph')
    }
    if (HTML_REGEX.test(node.text)) problems.add('raw HTML')
    return
  }

  if (options.docs && node.type && TABLE_TYPES.has(node.type)) {
    problems.add('a table (the docs page does not render tables)')
    return
  }
  if (!(node.type && BLOCK_TYPES.has(node.type))) {
    problems.add(node.type === 'h1' ? 'a level 1 heading (start at ##)' : `a "${node.type}" node`)
  }
  if (node.type === 'a' && !(options.docs ? DOC_LINK_REGEX : LINK_REGEX).test(node.url ?? '')) {
    problems.add(
      options.docs
        ? 'a link that is not http, https, mailto, or an app path'
        : 'a link that is not http, https, or mailto'
    )
  }
  if (node.listStyleType && !LIST_STYLES.has(node.listStyleType)) problems.add(`a "${node.listStyleType}" list`)

  for (const child of node.children ?? []) {
    inspect(child, { options, problems }, insideBlockquote || node.type === 'blockquote')
  }
}

export const findUnsupportedContent = (value: Value, options: InspectOptions = {}) => {
  const problems = new Set<string>()
  for (const node of value as unknown as PlateNode[]) inspect(node, { options, problems })
  return [...problems]
}

const collectLinks = (node: PlateNode): string[] => [
  ...(node.type === 'a' && node.url ? [node.url] : []),
  ...(node.children ?? []).flatMap(collectLinks),
]

export const markdownLinks = (value: Value) => (value as unknown as PlateNode[]).flatMap(collectLinks)

export const markdownBlockSignature = (value: Value) =>
  (value as unknown as PlateNode[])
    .map(node => [node.type, node.listStyleType ?? '', node.indent ?? ''].join(':'))
    .join('|')

export const markdownTextLength = (value: Value) => {
  const count = (node: PlateNode): number =>
    typeof node.text === 'string'
      ? node.text.length
      : (node.children ?? []).reduce((sum, child) => sum + count(child), 0)
  return (value as unknown as PlateNode[]).reduce((sum, node) => sum + count(node), 0)
}
