import { describe, expect, it, vi } from 'vitest'

import { AI_COMMAND_API, createAiChatTransport } from '@/components/ui/rich-text-editor/use-chat'

describe('createAiChatTransport', () => {
  it('posts the chat to the command route with the editor context', async () => {
    const fetch = vi.fn(() => Promise.resolve(new Response('', { headers: { 'content-type': 'text/event-stream' } })))
    const transport = createAiChatTransport({ fetch: fetch as unknown as typeof globalThis.fetch })
    const ctx = { children: [], selection: null, toolName: null }

    await transport.sendMessages({
      abortSignal: undefined,
      body: { ctx },
      chatId: 'editor',
      messageId: undefined,
      messages: [{ id: 'm', parts: [{ text: 'Improve the writing', type: 'text' }], role: 'user' }],
      trigger: 'submit-message',
    })

    expect(AI_COMMAND_API).toBe('/api/v1/ai/command')
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/v1/ai/command')
    const body = JSON.parse(init.body as string)
    expect(body.ctx).toEqual(ctx)
    expect(body.messages[0].parts[0].text).toBe('Improve the writing')
  })
})
