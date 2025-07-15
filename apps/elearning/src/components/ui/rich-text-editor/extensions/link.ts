import TiptapLink from '@tiptap/extension-link'
import { Plugin, TextSelection } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import { getMarkRange, mergeAttributes, type Editor } from '@tiptap/react'

interface ExtensionContext {
  parent?: () => Plugin[] | Record<string, unknown>
  options: {
    HTMLAttributes: Record<string, string>
  }
  editor: Editor
}

export const Link = TiptapLink.extend({
  /*
   * Determines whether typing next to a link automatically becomes part of the link.
   * In this case, we dont want any characters to be included as part of the link.
   */
  inclusive: false,
  /*
   * Match all <a> elements that have an href attribute, except for:
   * - <a> elements with a data-type attribute set to button
   * - <a> elements with an href attribute that contains 'javascript:'
   */
  parseHTML: () => [
    {
      tag: 'a[href]:not([data-type="button"]):not([href *= "javascript:" i])',
    },
  ],

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }) {
    const context = this as unknown as ExtensionContext
    return ['a', mergeAttributes(context.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addOptions(): Record<string, unknown> {
    const context = this as unknown as ExtensionContext
    const parentOptions = context.parent?.() ?? {}
    return {
      ...parentOptions,
      openOnClick: false,
      HTMLAttributes: {
        class: 'link',
      },
    }
  },

  addProseMirrorPlugins(): Plugin[] {
    const context = this as unknown as ExtensionContext
    const { editor } = context
    const parentResult = context.parent?.()
    const parentPlugins = Array.isArray(parentResult) ? parentResult : []

    return [
      ...parentPlugins,
      new Plugin({
        props: {
          handleKeyDown: (_: EditorView, event: KeyboardEvent) => {
            const { selection } = editor.state
            /*
             * Handles the 'Escape' key press when there's a selection within the link.
             * This will move the cursor to the end of the link.
             */
            if (event.key === 'Escape' && selection.empty !== true) {
              editor.commands.focus(selection.to, { scrollIntoView: false })
            }

            return false
          },
          handleClick: (view, pos) => {
            /*
             * Marks the entire link when the user clicks on it.
             */
            const { doc, schema, tr } = view.state
            const range = getMarkRange(doc.resolve(pos), schema.marks.link)

            if (!range) {
              return
            }

            const { from, to } = range
            const start = Math.min(from, to)
            const end = Math.max(from, to)

            if (pos < start || pos > end) {
              return
            }

            const $start = doc.resolve(start)
            const $end = doc.resolve(end)
            const transaction = tr.setSelection(new TextSelection($start, $end))

            view.dispatch(transaction)
          },
        },
      }),
    ]
  },
})
