'use client'

import dynamic from 'next/dynamic'

import { type Value } from 'platejs'

import { LoadingFallback } from '@/components/layout/loading-fallback'

const ReaderFallback = () => <LoadingFallback className="py-8" />

const RichTextEditor = dynamic(
  async () => {
    const m = await import('@/components/ui/rich-text-editor')
    return { default: m.RichTextEditor }
  },
  { loading: () => <ReaderFallback />, ssr: false }
)

const ReaderProvider = dynamic(
  async () => {
    const m = await import('@/components/features/courses/course-player/reader-provider')
    return { default: m.ReaderProvider }
  },
  { loading: () => <ReaderFallback />, ssr: false }
)

export const LessonReader = ({ content, version }: { content: unknown[]; version: string }) => (
  <ReaderProvider value={content as Value} version={version}>
    <div className="[&_[data-slate-editor]]:rounded-none [&_[data-slate-editor]]:border-0 [&_[data-slate-editor]]:p-0">
      <RichTextEditor variant="fullWidth" />
    </div>
  </ReaderProvider>
)
