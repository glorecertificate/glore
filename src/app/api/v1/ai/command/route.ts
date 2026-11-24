import { type NextRequest, NextResponse } from 'next/server'

import { InvalidArgumentError } from '@ai-sdk/provider'
import { delay as originalDelay } from '@ai-sdk/provider-utils'
import { type TextStreamPart, type ToolSet } from 'ai'
import { type Value } from 'platejs'
import { z } from 'zod'

import { buildCommandPrompt } from '@/app/api/v1/ai/command/prompt'
import { AI_ERROR, resolveAiModels, streamTextWithFallback } from '@/lib/ai'
import { authorizeEditorRequest, readJsonBody } from '@/lib/api'
import { isRateLimited } from '@/lib/rate-limit'

const pointSchema = z.object({
  offset: z.number().int().min(0),
  path: z.array(z.number().int().min(0)).max(32),
})

const bodySchema = z.object({
  ctx: z.object({
    children: z.array(z.record(z.string(), z.unknown())).min(1).max(5000),
    selection: z.object({ anchor: pointSchema, focus: pointSchema }).nullable(),
  }),
  messages: z
    .array(
      z.object({
        parts: z.array(z.object({ text: z.string().max(20_000).optional(), type: z.string().max(64) })).max(20),
        role: z.enum(['assistant', 'system', 'user']),
      })
    )
    .min(1)
    .max(50),
})

export const maxDuration = 60

const HOUR = 60 * 60 * 1000
const COMMANDS_PER_HOUR = 150

const CHUNKING_REGEXPS = {
  line: /\n+/mu,
  list: /.{8}/mu,
  word: /\S+\s+/mu,
}

const CODE_BLOCK_REGEX = /```[^\s]+/u

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
  }

  if (typeof chunking !== 'function') {
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
    let id = ''

    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      async transform(chunk, controller) {
        if (chunk.type !== 'text-delta') {
          if (buffer.length > 0) {
            controller.enqueue({ id, text: buffer, type: 'text-delta' } as TextStreamPart<TOOLS>)
            buffer = ''
          }
          controller.enqueue(chunk)
          return
        }

        id = chunk.id
        buffer += chunk.text
        let match: string | null | undefined
        match = detectChunk(buffer)

        while (match) {
          controller.enqueue({ id, text: match, type: 'text-delta' } as TextStreamPart<TOOLS>)
          buffer = buffer.slice(match.length)
          await delay(typeof delayInMs === 'number' ? delayInMs : (delayInMs?.(buffer) ?? 10))
          match = detectChunk(buffer)
        }
      },
    })
  }
}

export const POST = async (request: NextRequest) => {
  const { response, user } = await authorizeEditorRequest(request, 'ai:command', 20)
  if (response) return response
  if (await isRateLimited(`ai-command:${user.id}`, COMMANDS_PER_HOUR, HOUR)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = bodySchema.safeParse(await readJsonBody(request))
  if (!body.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const { ctx, messages } = body.data

  const models = resolveAiModels()
  if (!models) return NextResponse.json({ error: AI_ERROR.notConfigured }, { status: 503 })

  let prompt: string
  try {
    prompt = buildCommandPrompt({ ctx: { children: ctx.children as Value, selection: ctx.selection }, messages })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  let isInCodeBlock = false
  let isInTable = false
  let isInList = false
  let isInLink = false

  return streamTextWithFallback({
    abortSignal: request.signal,
    experimental_transform: smoothStream({
      chunking: buffer => {
        const opensCodeBlock = CODE_BLOCK_REGEX.test(buffer)
        if (opensCodeBlock) isInCodeBlock = true
        if (!opensCodeBlock && isInCodeBlock && buffer.includes('```')) isInCodeBlock = false

        const hasLink = buffer.includes('http')
        if (hasLink) isInLink = true
        if (!hasLink && buffer.includes('\n') && isInLink) isInLink = false

        const hasList = buffer.includes('*') || buffer.includes('-')
        if (hasList) isInList = true
        if (!hasList && buffer.includes('\n') && isInList) isInList = false

        const opensTable = !isInTable && buffer.includes('|')
        if (opensTable) isInTable = true
        if (!opensTable && isInTable && buffer.includes('\n\n')) isInTable = false

        let pattern = CHUNKING_REGEXPS.word
        if (isInList) pattern = CHUNKING_REGEXPS.list
        if (isInCodeBlock || isInTable || isInLink) pattern = CHUNKING_REGEXPS.line
        const match = pattern.exec(buffer)
        if (!match) {
          return null
        }

        return buffer.slice(0, match.index) + match?.[0]
      },
      delayInMs: () => (isInCodeBlock || isInTable ? 100 : 30),
    }),
    maxOutputTokens: 4096,
    models,
    prompt,
  })
}
