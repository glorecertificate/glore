'use client'

import { useEffect } from 'react'

import { useChat as useBaseChat } from '@ai-sdk/react'
import { AIChatPlugin, type useLastAssistantMessage } from '@platejs/ai/react'
import { DefaultChatTransport } from 'ai'
import { useEditorRef } from 'platejs/react'

type ChatMessage = NonNullable<ReturnType<typeof useLastAssistantMessage>>

export const AI_COMMAND_API = '/api/v1/ai/command'

export const createAiChatTransport = (
  options: Omit<ConstructorParameters<typeof DefaultChatTransport>[0], 'api'> = {}
) => new DefaultChatTransport({ ...options, api: AI_COMMAND_API })

const transport = createAiChatTransport()

export const useChat = () => {
  const editor = useEditorRef()
  const chat = useBaseChat<ChatMessage>({ id: 'editor', transport })

  useEffect(() => {
    editor.setOption(AIChatPlugin, 'chat', chat)
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-compiler/exhaustive-deps
  }, [chat.error, chat.messages, chat.status])

  return chat
}
