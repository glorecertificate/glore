import { type NextRequest, NextResponse } from 'next/server'

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'

import { auth } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

export const POST = async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { limited } = checkRateLimit(`ai:copilot:${session.user.id}`, 20, 60_000)
  if (limited) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const { prompt, system } = await request.json()

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
