import { type NextRequest, NextResponse } from 'next/server'

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { z } from 'zod'

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

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })

  const gemini = createGoogleGenerativeAI({ apiKey })

  try {
    return NextResponse.json(
      await generateText({
        abortSignal: request.signal,
        maxOutputTokens: 2048,
        model: gemini(process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'),
        prompt,
        system,
        temperature: 0.7,
      })
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request aborted' }, { status: 499 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
