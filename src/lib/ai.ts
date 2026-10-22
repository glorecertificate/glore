import 'server-only'

import { type GoogleLanguageModelOptions, createGoogleGenerativeAI } from '@ai-sdk/google'
import {
  type LanguageModel,
  type StreamTextTransform,
  type ToolSet,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  streamText,
} from 'ai'

import config from '~/config/app.json'

export const AI_ERROR = {
  notConfigured: 'ai_not_configured',
  unavailable: 'ai_unavailable',
} as const

interface GenerateOptions {
  models: LanguageModel[]
  prompt: string
  abortSignal?: AbortSignal
  maxOutputTokens?: number
  system?: string
  temperature?: number
}

interface StreamOptions extends GenerateOptions {
  experimental_transform?: StreamTextTransform<ToolSet>
}

const googleOptions: GoogleLanguageModelOptions = { thinkingConfig: { thinkingLevel: 'low' } }
const providerOptions = { google: googleOptions }

export const resolveAiModels = (): LanguageModel[] | null => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  const gemini = createGoogleGenerativeAI({ apiKey })
  const ids = [process.env.GEMINI_MODEL, ...config.aiModels].filter((id): id is string => !!id)
  return [...new Set(ids)].map(id => gemini(id))
}

const isAbort = (error: unknown, signal?: AbortSignal) =>
  !!signal?.aborted || (error instanceof Error && error.name === 'AbortError')

export const streamTextWithFallback = ({ models, ...options }: StreamOptions) =>
  createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        writer.write({ type: 'start' })
        for (const model of models) {
          const result = streamText({ ...options, maxRetries: 0, model, onError: () => undefined, providerOptions })
          let started = false
          let failure: unknown = new Error('The model returned no text')
          for await (const part of result.fullStream) {
            if (part.type === 'abort') return
            if (part.type === 'error') {
              failure = part.error
              break
            }
            if (part.type === 'text-delta') {
              if (!started) writer.write({ id: part.id, type: 'text-start' })
              started = true
              writer.write({ delta: part.text, id: part.id, type: 'text-delta' })
              continue
            }
            if (part.type === 'text-end' && started) writer.write({ id: part.id, type: 'text-end' })
            if (part.type === 'finish' && started) {
              writer.write({ type: 'finish' })
              return
            }
          }
          if (isAbort(failure, options.abortSignal)) return
          if (started) {
            writer.write({ errorText: AI_ERROR.unavailable, type: 'error' })
            return
          }
        }
        writer.write({ errorText: AI_ERROR.unavailable, type: 'error' })
      },
      onError: () => AI_ERROR.unavailable,
    }),
  })

export const generateTextWithFallback = async ({ models, ...options }: GenerateOptions) => {
  let failure: unknown
  for (const model of models) {
    try {
      // eslint-disable-next-line react-doctor/async-await-in-loop
      return await generateText({ ...options, maxRetries: 0, model, providerOptions })
    } catch (error) {
      if (isAbort(error, options.abortSignal)) throw error
      failure = error
    }
  }
  throw failure instanceof Error ? failure : new Error(AI_ERROR.unavailable)
}
