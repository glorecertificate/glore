'use client'

import { useChat as useBaseChat } from '@ai-sdk/react'
import { usePluginOption } from 'platejs/react'

import { aiChatPlugin } from '../plugins/ai'

export const useChat = () => {
  const options = usePluginOption(aiChatPlugin, 'chatOptions')
  return useBaseChat({ id: 'editor', ...options })
}
