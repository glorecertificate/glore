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
  firstTokenTimeoutMs?: number
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

const attemptSignal = (isLast: boolean, timeoutMs: number, signal?: AbortSignal) => {
  const controller = new AbortController()
  const timer = isLast ? undefined : setTimeout(() => controller.abort(), timeoutMs)
  const signals = signal ? [signal, controller.signal] : [controller.signal]
  return { clear: () => clearTimeout(timer), signal: AbortSignal.any(signals) }
}

export const streamTextWithFallback = ({
  firstTokenTimeoutMs = config.aiFirstTokenMs,
  models,
  ...options
}: StreamOptions) =>
  createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        writer.write({ type: 'start' })
        for (const [index, model] of models.entries()) {
          const attempt = attemptSignal(index === models.length - 1, firstTokenTimeoutMs, options.abortSignal)
          const result = streamText({
            ...options,
            abortSignal: attempt.signal,
            maxRetries: 0,
            model,
            onError: () => undefined,
            providerOptions,
          })
          let started = false
          for await (const part of result.fullStream) {
            if (part.type === 'abort' || part.type === 'error') break
            if (part.type === 'text-delta') {
              attempt.clear()
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
          attempt.clear()
          if (options.abortSignal?.aborted) return
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

export const generateTextWithFallback = async ({
  firstTokenTimeoutMs = config.aiFirstTokenMs,
  models,
  ...options
}: GenerateOptions) => {
  let failure: unknown
  for (const [index, model] of models.entries()) {
    const attempt = attemptSignal(index === models.length - 1, firstTokenTimeoutMs, options.abortSignal)
    try {
      // eslint-disable-next-line react-doctor/async-await-in-loop
      return await generateText({ ...options, abortSignal: attempt.signal, maxRetries: 0, model, providerOptions })
    } catch (error) {
      if (isAbort(error, options.abortSignal) && options.abortSignal?.aborted) throw error
      failure = error
    } finally {
      attempt.clear()
    }
  }
  throw failure instanceof Error ? failure : new Error(AI_ERROR.unavailable)
}
