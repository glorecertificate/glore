'use client'

import dynamic from 'next/dynamic'

import { type Value } from 'platejs'

import { Skeleton } from '@/components/ui/skeleton'

const ReaderSkeleton = () => (
  <div className="flex w-full flex-col gap-3 py-2">
    <Skeleton className="h-4 w-3/5" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-4/5" />
  </div>
)

const RichTextEditor = dynamic(
  async () => {
    const m = await import('@/components/ui/rich-text-editor')
    return { default: m.RichTextEditor }
  },
  { loading: () => <ReaderSkeleton />, ssr: false }
)

const ReaderProvider = dynamic(
  async () => {
    const m = await import('@/components/features/courses/course-player/reader-provider')
    return { default: m.ReaderProvider }
  },
  { loading: () => <ReaderSkeleton />, ssr: false }
)

export const LessonReader = ({ content, version }: { content: unknown[]; version: string }) => (
  <ReaderProvider value={content as Value} version={version}>
    <RichTextEditor variant="fullWidth" />
  </ReaderProvider>
)
