import { type TranslateEvent } from '@/lib/translate'

export interface TranslateRequest {
  fields: { existing?: Record<string, boolean>; key: string; text: unknown }[]
  replace?: boolean
  source: string
  targets: string[]
}

export interface TranslateFailure {
  key: string
  locale: string
  reason: string
}

export interface TranslateProgress {
  done: number
  failed: number
  ok: number
  skipped: number
  total: number
}

export const EMPTY_PROGRESS: TranslateProgress = { done: 0, failed: 0, ok: 0, skipped: 0, total: 0 }

export const advanceProgress = (progress: TranslateProgress, event: TranslateEvent): TranslateProgress => {
  if (event.type === 'start') return { ...progress, total: progress.total + event.total }
  if (event.type !== 'field') return progress
  if (event.status === 'ok') return { ...progress, done: progress.done + 1, ok: progress.ok + 1 }
  if (event.status === 'skipped') return { ...progress, done: progress.done + 1, skipped: progress.skipped + 1 }
  return { ...progress, done: progress.done + 1, failed: progress.failed + 1 }
}
