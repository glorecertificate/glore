'use client'

import { useRef } from 'react'

import { withAIBatch } from '@platejs/ai'
import { AIChatPlugin, AIPlugin, streamInsertChunk, useChatChunk } from '@platejs/ai/react'
import { BlockSelectionPlugin } from '@platejs/selection/react'
import { KEYS, PathApi } from 'platejs'
import { usePluginOption } from 'platejs/react'

import { AILoadingBar, AIMenu } from '@/components/ui/rich-text-editor/components/ai-menu'
import { AIAnchorElement, AILeaf } from '@/components/ui/rich-text-editor/components/ai-node'
import { aiChatPlugin as baseAiChatPlugin } from '@/components/ui/rich-text-editor/plugins/ai-chat-plugin'
import { CursorOverlayKit } from '@/components/ui/rich-text-editor/plugins/cursor-overlay'
import { MarkdownKit } from '@/components/ui/rich-text-editor/plugins/markdown'
import { useChat } from '@/components/ui/rich-text-editor/use-chat'

const aiChatPlugin = baseAiChatPlugin.extend({
  render: { afterContainer: AILoadingBar, afterEditable: AIMenu, node: AIAnchorElement },
  useHooks: ({ editor, getOption }) => {
    useChat()

    const mode = usePluginOption({ key: KEYS.aiChat }, 'mode') as 'insert' | 'select' | 'block-select'

    const insertedRef = useRef('')

    const getInsertPath = () => {
      const selection = editor.selection ?? getOption('chatSelection')
      if (selection) return selection.focus.path.slice(0, 1)
      const selectedBlock = editor.getApi(BlockSelectionPlugin).blockSelection.getNodes().at(-1)
      if (selectedBlock) return selectedBlock[1].slice(0, 1)
      const chatNodeId = getOption('chatNodes')?.at(-1)?.id
      const chatBlock = chatNodeId ? editor.api.node({ at: [], match: node => node.id === chatNodeId }) : undefined
      if (chatBlock) return chatBlock[1].slice(0, 1)
      return [Math.max(editor.children.length - 1, 0)]
    }

    useChatChunk({
      onChunk: ({ text }) => {
        if (mode !== 'insert') return
        const chunk = text.slice(insertedRef.current.length)
        if (!chunk) return
        const isFirst = insertedRef.current === ''

        if (isFirst) {
          const path = getInsertPath()

          editor.tf.withoutSaving(() => {
            editor.tf.insertNodes({ children: [{ text: '' }], type: KEYS.aiChat }, { at: PathApi.next(path) })
          })
          editor.setOption(AIChatPlugin, 'streaming', true)
        }

        withAIBatch(
          editor,
          () => {
            if (!getOption('streaming')) return
            editor.tf.withScrolling(() => {
              streamInsertChunk(editor, chunk, { textProps: { ai: true } })
            })
          },
          { split: isFirst }
        )
        insertedRef.current = text
      },
      onFinish: () => {
        queueMicrotask(() => {
          insertedRef.current = ''
          editor.setOption(AIChatPlugin, 'streaming', false)
          editor.setOption(AIChatPlugin, '_blockChunks', '')
          editor.setOption(AIChatPlugin, '_blockPath', null)
        })
      },
    })
  },
})

export const AIKit = [...CursorOverlayKit, ...MarkdownKit, AIPlugin.withComponent(AILeaf), aiChatPlugin]
