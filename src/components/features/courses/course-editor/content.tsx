'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'

import { type Value } from 'platejs'

import { useCourse } from '@/components/features/courses/course-editor/context'
import { LessonActivities } from '@/components/features/courses/course-editor/lesson-activities'
import { type PendingChange, commitPending } from '@/components/features/courses/course-editor/pending-change'
import { useSession } from '@/components/providers/session'
import { Skeleton } from '@/components/ui/skeleton'
import { type IntlRecord } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const SKELETON_TOOLBAR_GROUPS = [
  ['undo', 'redo'],
  ['insert', 'turn-into', 'ai'],
  ['bold', 'italic', 'underline'],
]

const SKELETON_TOOLBAR_WIDTH: Record<string, string> = {
  'turn-into': 'w-24',
}

const SkeletonToolbar = () => (
  <div className="flex w-full items-center gap-1 rounded-t-lg border border-b-0 border-border bg-input/30 p-1">
    {SKELETON_TOOLBAR_GROUPS.map((group, i) => (
      <div className="flex items-center gap-1" key={group.join('-')}>
        {i > 0 && <div className="mr-1 h-5 w-px shrink-0 bg-border" />}
        {group.map(id => (
          <Skeleton className={cn('h-8 rounded-sm', SKELETON_TOOLBAR_WIDTH[id] ?? 'w-8')} key={id} />
        ))}
      </div>
    ))}
  </div>
)

const EditorSkeleton = () => (
  <div className="relative w-full cursor-wait select-none">
    <SkeletonToolbar />
    <div className="rounded-b-lg border px-8 pt-8 pb-72 text-base sm:px-12">
      <div className="flex h-8 items-center">
        <Skeleton className="h-3.5 w-2/5" />
      </div>
    </div>
  </div>
)

const LessonEditor = dynamic(
  async () => {
    const m = await import('@/components/features/courses/course-editor/lesson-editor')
    return { default: m.LessonEditor }
  },
  { loading: () => <EditorSkeleton />, ssr: false }
)
const RichTextEditorProvider = dynamic(
  async () => {
    const m = await import('@/components/ui/rich-text-editor/provider')
    return { default: m.RichTextEditorProvider }
  },
  { loading: () => <EditorSkeleton />, ssr: false }
)

const CourseEditor = ({
  initialValue,
  onChange,
  readOnly,
  version,
  flushRef,
}: {
  initialValue: Value
  onChange: (value: Value) => void
  readOnly: boolean
  version: string
  flushRef: React.RefObject<(() => unknown) | null>
}) => {
  const onChangeRef = useRef(onChange)
  const pendingRef = useRef<PendingChange<Value> | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    flushRef.current = () => commitPending(pendingRef, timerRef)
    return () => {
      flushRef.current = null
    }
  }, [flushRef])

  useEffect(
    () => () => {
      commitPending(pendingRef, timerRef)
    },
    [version]
  )

  const setValue = (newValue: { value?: Value }) => {
    const value = newValue.value ?? (newValue as unknown as Value)
    clearTimeout(timerRef.current)
    pendingRef.current = { commit: onChangeRef.current, value }
    timerRef.current = setTimeout(() => commitPending(pendingRef, timerRef), 500)
  }

  return (
    <RichTextEditorProvider onChange={setValue} readOnly={readOnly} value={initialValue} version={version}>
      <LessonEditor variant="fullWidth" />
    </RichTextEditorProvider>
  )
}

export const CourseContent = () => {
  const { contentFlushRef, course, currentLesson, language, setLesson, step } = useCourse()
  const { user } = useSession()

  const canEdit = user.canEdit && !course.archivedAt
  const courseStateRef = useRef(course)
  courseStateRef.current = course
  const lessonId = currentLesson.id

  const onContentChange = (value: Value) => {
    const lesson = courseStateRef.current.lessons.find(item => item.id === lessonId) ?? currentLesson
    setLesson({
      content: {
        ...lesson.content,
        [language]: value,
      } as IntlRecord,
      id: lessonId,
    })
  }

  const initialContent = currentLesson?.content?.[language] || [{ type: 'p', children: [{ text: '' }] }]
  const editorVersion = `${step}-${language}`

  return (
    <>
      <CourseEditor
        flushRef={contentFlushRef}
        initialValue={initialContent as Value}
        onChange={onContentChange}
        readOnly={!canEdit}
        version={editorVersion}
      />
      {canEdit && <LessonActivities className="mt-4" />}
    </>
  )
}
