import { insertCallout } from '@platejs/callout'
import { insertDate } from '@platejs/date'
import { insertColumnGroup, toggleColumnGroup } from '@platejs/layout'
import { triggerFloatingLink } from '@platejs/link/react'
import { insertAudioPlaceholder, insertFilePlaceholder, insertMedia, insertVideoPlaceholder } from '@platejs/media'
import { TablePlugin } from '@platejs/table/react'
import { insertToc } from '@platejs/toc'
import { KEYS, type NodeEntry, type Path, PathApi, type TElement, isHotkey as isPlateHotkey } from 'platejs'
import { type HotkeysOptions, type PlateEditor } from 'platejs/react'

const ACTION_THREE_COLUMNS = 'action_three_columns'

const insertList = (editor: PlateEditor, type: string) => {
  editor.tf.insertNodes(
    editor.api.create.block({
      indent: 1,
      listStyleType: type,
    }),
    { select: true }
  )
}

const insertBlockMap: Record<string, (editor: PlateEditor, type: string) => void | Promise<void>> = {
  [KEYS.listTodo]: insertList,
  [KEYS.ol]: insertList,
  [KEYS.ul]: insertList,
  [ACTION_THREE_COLUMNS]: editor => insertColumnGroup(editor, { columns: 3, select: true }),
  [KEYS.audio]: editor => insertAudioPlaceholder(editor, { select: true }),
  [KEYS.callout]: editor => insertCallout(editor, { select: true }),
  [KEYS.file]: editor => insertFilePlaceholder(editor, { select: true }),
  [KEYS.img]: editor =>
    insertMedia(editor, {
      select: true,
      type: KEYS.img,
    }),
  [KEYS.mediaEmbed]: editor =>
    insertMedia(editor, {
      select: true,
      type: KEYS.mediaEmbed,
    }),
  [KEYS.table]: editor => editor.getTransforms(TablePlugin).insert.table({}, { select: true }),
  [KEYS.toc]: editor => insertToc(editor, { select: true }),
  [KEYS.video]: editor => insertVideoPlaceholder(editor, { select: true }),
}

const insertInlineMap: Record<string, (editor: PlateEditor, type: string) => void> = {
  [KEYS.date]: editor => insertDate(editor, { select: true }),
  [KEYS.link]: editor => triggerFloatingLink(editor, { focused: true }),
}

export const insertBlock = (editor: PlateEditor, type: string) =>
  editor.tf.withoutNormalizing(() => {
    const block = editor.api.block()
    if (!block) return

    if (type in insertBlockMap) {
      void insertBlockMap[type](editor, type)
      return
    }
    editor.tf.insertNodes(editor.api.create.block({ type }), {
      at: PathApi.next(block[1]),
      select: true,
    })
  })

export const insertInlineElement = (editor: PlateEditor, type: string) => {
  insertInlineMap[type]?.(editor, type)
}

const setList = (editor: PlateEditor, type: string, entry: NodeEntry<TElement>) =>
  editor.tf.setNodes(
    editor.api.create.block({
      indent: 1,
      listStyleType: type,
    }),
    {
      at: entry[1],
    }
  )

const setBlockMap: Record<string, (editor: PlateEditor, type: string, entry: NodeEntry<TElement>) => void> = {
  [KEYS.listTodo]: setList,
  [KEYS.ol]: setList,
  [KEYS.ul]: setList,
  [ACTION_THREE_COLUMNS]: editor => toggleColumnGroup(editor, { columns: 3 }),
}

export const setBlockType = (editor: PlateEditor, type: string, { at }: { at?: Path } = {}) =>
  editor.tf.withoutNormalizing(() => {
    const setEntry = (entry: NodeEntry<TElement>) => {
      const [node, path] = entry

      if (node[KEYS.listType]) {
        editor.tf.unsetNodes([KEYS.listType, 'indent'], { at: path })
      }
      if (type in setBlockMap) {
        return setBlockMap[type](editor, type, entry)
      }
      if (node.type !== type) {
        editor.tf.setNodes({ type }, { at: path })
      }
    }

    if (at) {
      const entry = editor.api.node(at) as NodeEntry<TElement> | undefined
      if (entry) {
        return setEntry(entry)
      }
    }

    for (const entry of editor.api.blocks({ mode: 'lowest' })) {
      setEntry(entry)
    }
  })

export const getBlockType = (block: TElement) => {
  if (!block[KEYS.listType]) return block.type
  if (block[KEYS.listType] === KEYS.ol) return KEYS.ol
  if (block[KEYS.listType] === KEYS.listTodo) return KEYS.listTodo
  return KEYS.ul
}

export const isHotkey = isPlateHotkey as <T extends React.KeyboardEvent>(
  hotkey: string | readonly string[],
  options?: HotkeysOptions
) => (event: T) => boolean
