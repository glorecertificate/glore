'use client'

import { useEffect, useRef } from 'react'

import { type Value } from 'platejs'

import { useCourse } from '@/components/features/courses/course-editor/context'
import { LessonActivities } from '@/components/features/courses/course-editor/lesson-activities'
import { type PendingChange, commitPending } from '@/components/features/courses/course-editor/pending-change'
import { resolvedDynamic } from '@/components/features/courses/course-editor/resolved-dynamic'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { useSession } from '@/components/providers/session'
import { type IntlRecord } from '@/lib/i18n'

const EditorFallback = () => <LoadingFallback className="min-h-96 rounded-lg border" />

const lessonEditor = resolvedDynamic(
  async () => (await import('@/components/features/courses/course-editor/lesson-editor')).LessonEditor,
  EditorFallback
)
const richTextEditorProvider = resolvedDynamic(
  async () => (await import('@/components/ui/rich-text-editor/provider')).RichTextEditorProvider,
  EditorFallback
)

export const preloadLessonEditor = async () => {
  await Promise.all([lessonEditor.preload(), richTextEditorProvider.preload()])
}

const LessonEditor = lessonEditor.Component
const RichTextEditorProvider = richTextEditorProvider.Component

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

  const setValue = (newValue: { editor?: { operations: { type: string }[] }; value?: Value }) => {
    const hasEdit = newValue.editor?.operations.some(operation => operation.type !== 'set_selection')
    if (!hasEdit) return
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
  const { contentFlushRef, course, currentLesson, language, lessonKeys, setLesson } = useCourse()
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
  const editorVersion = `${lessonKeys[currentLesson.id!] ?? currentLesson.id}-${language}`

  return (
    <>
      <CourseEditor
        key={editorVersion}
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
