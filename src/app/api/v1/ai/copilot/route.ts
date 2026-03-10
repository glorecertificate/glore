import { type NextRequest, NextResponse } from 'next/server'

import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

export const POST = async (request: NextRequest) => {
  const { apiKey: key, model = process.env.OPENAI_MODEL, prompt, system } = await request.json()

  const apiKey = key ?? process.env.OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 401 })
  }

  const openai = createOpenAI({ apiKey })

  try {
    return NextResponse.json(
      await generateText({
        abortSignal: request.signal,
        maxOutputTokens: 50,
        model: openai(model ?? 'gpt-5'),
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
