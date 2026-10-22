import { type NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { AI_ERROR, generateTextWithFallback, resolveAiModels } from '@/lib/ai'
import { authorizeEditorRequest, readJsonBody } from '@/lib/api'

export const maxDuration = 60

const bodySchema = z.object({
  prompt: z.string().min(1).max(20_000),
  system: z.string().max(5000).optional(),
})

export const POST = async (request: NextRequest) => {
  const { response } = await authorizeEditorRequest(request, 'ai:copilot', 30)
  if (response) return response

  const body = bodySchema.safeParse(await readJsonBody(request))
  if (!body.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const { prompt, system } = body.data

  const models = resolveAiModels()
  if (!models) return NextResponse.json({ error: AI_ERROR.notConfigured }, { status: 503 })

  try {
    const { text } = await generateTextWithFallback({
      abortSignal: request.signal,
      maxOutputTokens: 4096,
      models,
      prompt,
      system,
      temperature: 0.7,
    })
    return NextResponse.json({ text })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request aborted' }, { status: 499 })
    }
    return NextResponse.json({ error: AI_ERROR.unavailable }, { status: 503 })
  }
}
