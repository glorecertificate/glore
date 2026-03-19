import { type NextRequest, NextResponse } from 'next/server'

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'

export const POST = async (request: NextRequest) => {
  const { apiKey: key, model = process.env.GEMINI_MODEL, prompt, system } = await request.json()

  const apiKey = key ?? process.env.GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 401 })
  }

  const gemini = createGoogleGenerativeAI({ apiKey })

  try {
    return NextResponse.json(
      await generateText({
        abortSignal: request.signal,
        maxOutputTokens: 50,
        model: gemini(model ?? 'gemini-2.0-flash'),
        prompt,
        system,
        temperature: 0.7,
      })
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request aborted' }, { status: 499 })
    }
    return NextResponse.json({ details: error, error: 'Failed to process AI request' }, { status: 500 })
  }
}
