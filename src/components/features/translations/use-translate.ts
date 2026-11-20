'use client'

import { useEffect, useRef, useState } from 'react'

import {
  EMPTY_PROGRESS,
  type TranslateFailure,
  type TranslateProgress,
  type TranslateRequest,
  advanceProgress,
} from '@/components/features/translations/translate-progress'
import { type TranslateEvent } from '@/lib/translate'

export type TranslatedField = Extract<TranslateEvent, { status: 'ok' }>

export type TranslateStatus = 'cancelled' | 'done' | 'error' | 'idle' | 'running'

interface UseTranslateOptions {
  onField: (field: TranslatedField) => void
}

const ENDPOINT = '/api/v1/ai/translate'

const ERROR_CODES: Record<number, string> = {
  401: 'FORBIDDEN',
  403: 'FORBIDDEN',
  429: 'RATE_LIMITED',
  503: 'ai_not_configured',
}

const parseEvent = (line: string) => {
  try {
    return JSON.parse(line) as TranslateEvent
  } catch {
    return null
  }
}

export const useTranslate = ({ onField }: UseTranslateOptions) => {
  const [status, setStatus] = useState<TranslateStatus>('idle')
  const [progress, setProgress] = useState<TranslateProgress>(EMPTY_PROGRESS)
  const [failures, setFailures] = useState<TranslateFailure[]>([])
  const [error, setError] = useState<string | null>(null)
  const controller = useRef<AbortController | null>(null)
  const handler = useRef(onField)

  useEffect(() => {
    handler.current = onField
  })

  useEffect(() => () => controller.current?.abort(), [])

  const apply = (event: TranslateEvent) => {
    if (event.type === 'field' && event.status === 'ok') handler.current(event)
    if (event.type === 'field' && event.status === 'failed') {
      setFailures(current => [...current, { key: event.key, locale: event.locale, reason: event.reason }])
    }
    setProgress(current => advanceProgress(current, event))
  }

  const run = async (request: TranslateRequest) => {
    setProgress(EMPTY_PROGRESS)
    setFailures([])
    const abort = new AbortController()
    controller.current?.abort()
    controller.current = abort
    setStatus('running')
    setError(null)
    let finished = false
    let failed: string | null = null
    let failedFields = 0
    const handle = (line: string) => {
      const event = line.trim() ? parseEvent(line) : null
      if (!event) return
      if (event.type === 'done') finished = true
      if (event.type === 'error') failed = event.code
      if (event.type === 'field' && event.status === 'failed') failedFields += 1
      apply(event)
    }
    try {
      const response = await fetch(ENDPOINT, {
        body: JSON.stringify(request),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        signal: abort.signal,
      })
      if (!response.ok || !response.body) {
        setError(ERROR_CODES[response.status] ?? 'ai_unavailable')
        setStatus('error')
        return false
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        buffer += decoder.decode(chunk.value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) handle(line)
      }
      handle(buffer)
    } catch {
      if (abort.signal.aborted) return false
      setError('ai_unavailable')
      setStatus('error')
      return false
    }
    if (finished && !failed) {
      setStatus('done')
      return failedFields === 0
    }
    setError(failed ?? 'ai_unavailable')
    setStatus('error')
    return false
  }

  const cancel = () => {
    controller.current?.abort()
    controller.current = null
    setStatus(current => (current === 'running' ? 'cancelled' : current))
  }

  const reset = () => {
    controller.current?.abort()
    controller.current = null
    setStatus('idle')
    setProgress(EMPTY_PROGRESS)
    setFailures([])
    setError(null)
  }

  return { cancel, error, failures, progress, reset, run, status }
}
