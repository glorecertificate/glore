import { type NextRequest, NextResponse } from 'next/server'

import { createOpenAI } from '@ai-sdk/openai'
import { InvalidArgumentError } from '@ai-sdk/provider'
import { delay as originalDelay } from '@ai-sdk/provider-utils'
import { type TextStreamPart, type ToolSet, convertToModelMessages, streamText } from 'ai'

const CHUNKING_REGEXPS = {
  line: /\n+/m,
  list: /.{8}/m,
  word: /\S+\s+/m,
}

const CODE_BLOCK_REGEX = /```[^\s]+/

type ChunkDetector = (buffer: string) => string | null | undefined

const smoothStream = <TOOLS extends ToolSet>({
  _internal: { delay = originalDelay } = {},
  chunking = 'word',
  delayInMs = 10,
}: {
  _internal?: {
    delay?: (delayInMs: number | null) => Promise<void>
  }
  chunking?: ChunkDetector | RegExp | 'line' | 'word'
  delayInMs?: ((buffer: string) => number) | number | null
} = {}): ((options: { tools: TOOLS }) => TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>) => {
  let detectChunk: ChunkDetector

  if (typeof chunking === 'function') {
    detectChunk = buffer => {
      const match = chunking(buffer)
      if (!match) {
        return null
      }
      if (match.length === 0) {
        throw new Error('Chunking function must return a non-empty string.')
      }

      if (!buffer.startsWith(match)) {
        throw new Error(
          `Chunking function must return a match that is a prefix of the buffer. Received: "${match}" expected to start with "${buffer}"`
        )
      }

      return match
    }
  } else {
    const chunkingRegex = typeof chunking === 'string' ? CHUNKING_REGEXPS[chunking] : chunking

    if (!chunkingRegex) {
      throw new InvalidArgumentError({
        argument: 'chunking',
        message: `Chunking must be "word" or "line" or a RegExp. Received: ${chunking}`,
      })
    }

    detectChunk = buffer => {
      const match = chunkingRegex.exec(buffer)
      if (!match) {
        return null
      }
      return buffer.slice(0, match.index) + match?.[0]
    }
  }

  return () => {
    let buffer = ''

    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      async transform(chunk, controller) {
        if (chunk.type !== 'text-delta') {
          if (buffer.length > 0) {
            controller.enqueue({ text: buffer, type: 'text-delta' } as TextStreamPart<TOOLS>)
            buffer = ''
          }
          controller.enqueue(chunk)
          return
        }

        buffer += chunk.text
        let match: string | null | undefined
        match = detectChunk(buffer)

        while (match) {
          controller.enqueue({ text: match, type: 'text-delta' } as TextStreamPart<TOOLS>)
          buffer = buffer.slice(match.length)
          const _delayInMs = typeof delayInMs === 'number' ? delayInMs : (delayInMs?.(buffer) ?? 10)
          await delay(_delayInMs)
          match = detectChunk(buffer)
        }
      },
    })
  }
}

export const POST = async (request: NextRequest) => {
  const { apiKey, messages, system } = await request.json()

  const key = apiKey ?? process.env.OPENAI_API_KEY

  if (!key) {
    return NextResponse.json({ error: 'Missing OpenAI API key.' }, { status: 401 })
  }

  const openai = createOpenAI({ apiKey: key })

  let isInCodeBlock = false
  let isInTable = false
  let isInList = false
  let isInLink = false

  try {
    const result = streamText({
      experimental_transform: smoothStream({
        chunking: buffer => {
          if (CODE_BLOCK_REGEX.test(buffer)) {
            isInCodeBlock = true
          } else if (isInCodeBlock && buffer.includes('```')) {
            isInCodeBlock = false
          }
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
          if (!isInTable && buffer.includes('|')) {
            isInTable = true
          } else if (isInTable && buffer.includes('\n\n')) {
            isInTable = false
          }

          let match: RegExpExecArray | null
          if (isInCodeBlock || isInTable || isInLink) {
            match = CHUNKING_REGEXPS.line.exec(buffer)
          } else if (isInList) {
            match = CHUNKING_REGEXPS.list.exec(buffer)
          } else {
            match = CHUNKING_REGEXPS.word.exec(buffer)
          }
          if (!match) {
            return null
          }

          return buffer.slice(0, match.index) + match?.[0]
        },
        delayInMs: () => (isInCodeBlock || isInTable ? 100 : 30),
      }),
      maxOutputTokens: 2048,
      messages: await convertToModelMessages(messages),
      model: openai(process.env.OPENAI_MODEL ?? 'gpt-5'),
      system,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 })
  }
}
