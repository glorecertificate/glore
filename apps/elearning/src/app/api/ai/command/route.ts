import '@glore/env'

import { type NextRequest, NextResponse } from 'next/server'

import { createOpenAI } from '@ai-sdk/openai'
import { InvalidArgumentError } from '@ai-sdk/provider'
import { delay as originalDelay } from '@ai-sdk/provider-utils'
import { type Message, type TextStreamPart, type ToolSet, convertToCoreMessages, streamText } from 'ai'

/**
 * Detects the first chunk in a buffer.
 */
export type ChunkDetector = (buffer: string) => string | null | undefined

/**
 * Smooths text streaming output.
 *
 * @returns A transform stream that smooths text streaming output.
 */
const smoothStream = <TOOLS extends ToolSet>({
  _internal: { delay = originalDelay } = {},
  chunking = 'word',
  delayInMs = 10,
}: {
  /**
   * Internal, for test use only.
   */
  _internal?: {
    delay?: (delayInMs: number | null) => Promise<void>
  }
  /**
   * Controls how the text is chunked for streaming.
   * Use "word" to stream word by word (default), "line" to stream line by line,
   * or provide a custom RegExp pattern for custom chunking.
   */
  chunking?: ChunkDetector | RegExp | 'line' | 'word'
  /**
   * Delay in milliseconds between each chunk defaulting to 10ms.
   * Can be set to null to skip the delay.
   */
  delayInMs?: ((buffer: string) => number) | number | null
} = {}): ((options: { tools: TOOLS }) => TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>) => {
  let detectChunk: ChunkDetector

  if (typeof chunking === 'function') {
    detectChunk = buffer => {
      const match = chunking(buffer)

      if (!match) return null

      if (match.length === 0) throw new Error('Chunking function must return a non-empty string.')

      if (!buffer.startsWith(match))
        throw new Error(
          `Chunking function must return a match that is a prefix of the buffer. Received: "${match}" expected to start with "${buffer}"`
        )

      return match
    }
  } else {
    const chunkingRegex = typeof chunking === 'string' ? CHUNKING_REGEXPS[chunking] : chunking

    if (!chunkingRegex)
      throw new InvalidArgumentError({
        argument: 'chunking',
        message: `Chunking must be "word" or "line" or a RegExp. Received: ${chunking}`,
      })

    detectChunk = buffer => {
      const match = chunkingRegex.exec(buffer)
      if (!match) return null
      return buffer.slice(0, match.index) + match?.[0]
    }
  }

  return () => {
    let buffer = ''

    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      async transform(chunk, controller) {
        if (chunk.type !== 'text-delta') {
          if (buffer.length > 0) {
            controller.enqueue({ textDelta: buffer, type: 'text-delta' })
            buffer = ''
          }
          controller.enqueue(chunk)
          return
        }

        buffer += chunk.textDelta

        let match: string | null | undefined

        match = detectChunk(buffer)
        while (match) {
          controller.enqueue({ textDelta: match, type: 'text-delta' })
          buffer = buffer.slice(match.length)

          const _delayInMs = typeof delayInMs === 'number' ? delayInMs : (delayInMs?.(buffer) ?? 10)

          await delay(_delayInMs)

          match = detectChunk(buffer)
        }
      },
    })
  }
}

const CHUNKING_REGEXPS = {
  line: /\n+/m,
  list: /.{8}/m,
  word: /\S+\s+/m,
}

const CODE_BLOCK_REGEX = /```[^\s]+/

export const POST = async (req: NextRequest) => {
  const {
    apiKey: key,
    messages,
    system,
  } = (await req.json()) as {
    apiKey?: string
    messages: Omit<Message, 'id'>[]
    system?: string
  }

  const apiKey = key ?? process.env.OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OpenAI API key.' }, { status: 401 })
  }

  const openai = createOpenAI({ apiKey })

  let isInCodeBlock = false
  let isInTable = false
  let isInList = false
  let isInLink = false
  try {
    const result = streamText({
      experimental_transform: smoothStream({
        chunking: buffer => {
          // Check for code block markers
          if (CODE_BLOCK_REGEX.test(buffer)) {
            isInCodeBlock = true
          } else if (isInCodeBlock && buffer.includes('```')) {
            isInCodeBlock = false
          }
          // test case: should not deserialize link with markdown syntax
          if (buffer.includes('http')) {
            isInLink = true
          } else if (buffer.includes('https')) {
            isInLink = true
          } else if (buffer.includes('\n') && isInLink) {
            isInLink = false
          }
          if (buffer.includes('*') || buffer.includes('-')) {
            isInList = true
          } else if (buffer.includes('\n') && isInList) {
            isInList = false
          }
          // Simple table detection: enter on |, exit on double newline
          if (!isInTable && buffer.includes('|')) {
            isInTable = true
          } else if (isInTable && buffer.includes('\n\n')) {
            isInTable = false
          }

          // Use line chunking for code blocks and tables, word chunking otherwise
          // Choose the appropriate chunking strategy based on content type
          let match: RegExpExecArray | null

          if (isInCodeBlock || isInTable || isInLink) {
            // Use line chunking for code blocks and tables
            match = CHUNKING_REGEXPS.line.exec(buffer)
          } else if (isInList) {
            // Use list chunking for lists
            match = CHUNKING_REGEXPS.list.exec(buffer)
          } else {
            // Use word chunking for regular text
            match = CHUNKING_REGEXPS.word.exec(buffer)
          }
          if (!match) {
            return null
          }

          return buffer.slice(0, match.index) + match?.[0]
        },
        delayInMs: () => (isInCodeBlock || isInTable ? 100 : 30),
      }),
      maxTokens: 2048,
      messages: convertToCoreMessages(messages),
      model: openai(process.env.OPENAI_MODEL),
      system,
    })

    return result.toDataStreamResponse()
  } catch {
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 })
  }
}
