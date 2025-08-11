'use client'

import { useChat as useBaseChat } from '@ai-sdk/react'
import { usePluginOption } from 'platejs/react'

import { type AnyRecord } from '@repo/utils/types'

import { aiChatPlugin } from '@rte/kits/ai'

export const useChat = () => {
  const options = usePluginOption(aiChatPlugin, 'chatOptions') as AnyRecord
  return useBaseChat({ id: 'editor', ...options })
}
