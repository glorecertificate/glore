'use client'

import { withAIBatch } from '@platejs/ai'
import { AIChatPlugin, AIPlugin, streamInsertChunk, useChatChunk } from '@platejs/ai/react'
import { KEYS, PathApi } from 'platejs'
import { usePluginOption } from 'platejs/react'

import { aiChatPlugin as baseAiChatPlugin } from '@/components/blocks/rich-text-editor/plugins/ai-chat-plugin'
import { CursorOverlayKit } from '@/components/blocks/rich-text-editor/plugins/cursor-overlay'
import { MarkdownKit } from '@/components/blocks/rich-text-editor/plugins/markdown'
import { AILoadingBar, AIMenu } from '@/components/blocks/rich-text-editor/ui/ai-menu'
import { AIAnchorElement, AILeaf } from '@/components/blocks/rich-text-editor/ui/ai-node'

export const aiChatPlugin = baseAiChatPlugin.extend({
  render: { afterContainer: AILoadingBar, afterEditable: AIMenu, node: AIAnchorElement },
  useHooks: ({ editor, getOption }) => {
    const mode = usePluginOption({ key: KEYS.aiChat }, 'mode') as 'insert' | 'select' | 'block-select'

    useChatChunk({
      onChunk: ({ chunk, isFirst, nodes }) => {
        if (isFirst && mode === 'insert') {
          const path = editor.selection?.focus.path.slice(0, 1)

          editor.tf.withoutSaving(() => {
            editor.tf.insertNodes({ children: [{ text: '' }], type: KEYS.aiChat }, { at: PathApi.next(path!) })
          })
          editor.setOption(AIChatPlugin, 'streaming', true)
        }

        if (mode === 'insert' && nodes.length > 0) {
          withAIBatch(
            editor,
            () => {
              if (!getOption('streaming')) {
                return
              }
              editor.tf.withScrolling(() => {
                streamInsertChunk(editor, chunk, { textProps: { ai: true } })
              })
            },
            { split: isFirst }
          )
        }
      },
      onFinish: () => {
        editor.setOption(AIChatPlugin, 'streaming', false)
        editor.setOption(AIChatPlugin, '_blockChunks', '')
        editor.setOption(AIChatPlugin, '_blockPath', null)
      },
    })
  },
})

export const AIKit = [...CursorOverlayKit, ...MarkdownKit, AIPlugin.withComponent(AILeaf), aiChatPlugin]

export { PROMPT_TEMPLATES } from '@/components/blocks/rich-text-editor/plugins/ai-chat-plugin'
