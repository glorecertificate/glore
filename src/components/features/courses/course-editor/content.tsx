'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'

import { type Value } from 'platejs'

import { submitAnswers } from '@/actions/courses/progress'
import { CourseAssessment } from '@/components/features/courses/course-editor/assessment'
import { useCourse } from '@/components/features/courses/course-editor/context'
import { CourseEvaluations } from '@/components/features/courses/course-editor/evaluations'
import { LessonActivities } from '@/components/features/courses/course-editor/lesson-activities'
import { CourseQuestions } from '@/components/features/courses/course-editor/questions'
import { Skeleton } from '@/components/ui/skeleton'
import { type Question, type QuestionOption } from '@/db/queries/lesson'
import { useSession } from '@/hooks/use-session'
import { type IntlRecord } from '@/lib/i18n'
import { cn, debounce } from '@/lib/utils'

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

const RichTextEditor = dynamic(
  async () => {
    const m = await import('@/components/blocks/rich-text-editor')
    return { default: m.RichTextEditor }
  },
  { loading: () => <EditorSkeleton />, ssr: false }
)
const RichTextEditorProvider = dynamic(
  async () => {
    const m = await import('@/components/blocks/rich-text-editor/provider')
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
  flushRef: React.RefObject<(() => void) | null>
}) => {
  const onChangeRef = useRef(onChange)
  const latestValueRef = useRef(initialValue)
  const appliedRef = useRef(true)

  useEffect(() => {
    onChangeRef.current = onChange
  })

  const debouncedOnChange = debounce((value: Value) => {
    onChangeRef.current(value)
    appliedRef.current = true
  }, 500)

  useEffect(() => {
    latestValueRef.current = initialValue
    appliedRef.current = true
    return () => {
      debouncedOnChange.cancel()
    }
  }, [debouncedOnChange, initialValue])

  useEffect(() => {
    flushRef.current = () => {
      debouncedOnChange.cancel()
      if (!appliedRef.current) {
        onChangeRef.current(latestValueRef.current)
      }
    }
    return () => {
      flushRef.current = null
    }
  }, [flushRef, debouncedOnChange])

  useEffect(
    () => () => {
      debouncedOnChange.cancel()
    },
    [debouncedOnChange]
  )

  const setValue = (newValue: { value?: Value }) => {
    const value = newValue.value ?? (newValue as unknown as Value)
    latestValueRef.current = value
    appliedRef.current = false
    debouncedOnChange(value)
  }

  return (
    <RichTextEditorProvider onChange={setValue} readOnly={readOnly} value={initialValue} version={version}>
      <RichTextEditor autoFocus variant="fullWidth" />
    </RichTextEditorProvider>
  )
}

export const CourseContent = () => {
  const { contentFlushRef, course, currentLesson, language, setCourse, setLesson, step } = useCourse()
  const { user } = useSession()

  const canEdit = user.canEdit && !course.archivedAt
  const currentLessonRef = useRef(currentLesson)
  currentLessonRef.current = currentLesson

  const onQuestionAnswer = async (question: Question, option: QuestionOption) => {
    setCourse(({ lessons, ...rest }) => ({
      ...rest,
      lessons: lessons?.map((lesson, i) =>
        i === step - 1 && lesson.questions
          ? {
              ...lesson,
              questions: lesson.questions.map(q =>
                q.id === question.id
                  ? {
                      ...q,
                      answered: true,
                      options: q.options.map(o => ({ ...o, isUserAnswer: o.id === option.id })),
                    }
                  : q
              ),
            }
          : lesson
      ),
    }))
    try {
      await submitAnswers([{ id: option.id }])
    } catch (e) {
      console.error(e)
    }
  }

  const onEvaluation = (id: number, rating: number) => {
    setCourse(({ lessons, ...rest }) => ({
      ...rest,
      lessons: lessons?.map((lesson, i) =>
        i === step - 1 && lesson.evaluations
          ? {
              ...lesson,
              evaluations: lesson.evaluations.map(e => (e.id === id ? { ...e, userRating: rating } : e)),
            }
          : lesson
      ),
    }))
  }

  const onAssessment = (rating: number) => {
    setCourse(({ lessons, ...rest }) => ({
      ...rest,
      lessons: lessons?.map((lesson, i) =>
        i === step - 1 && lesson.assessment
          ? { ...lesson, assessment: { ...lesson.assessment, userRating: rating } }
          : lesson
      ),
    }))
  }

  const onContentChange = (value: Value) => {
    setLesson({
      content: {
        ...currentLessonRef.current.content,
        [language]: value,
      } as IntlRecord,
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
      {!canEdit && currentLesson?.type === 'questions' && currentLesson.questions && (
        <CourseQuestions
          className={cn('mt-8 border-t-2 pt-6')}
          completed={currentLesson.completed}
          onComplete={onQuestionAnswer}
          questions={currentLesson.questions}
        />
      )}
      {!canEdit && currentLesson?.type === 'evaluations' && currentLesson.evaluations && (
        <CourseEvaluations
          className={cn('mt-8 border-t-2 pt-6')}
          completed={!!currentLesson.completed}
          evaluations={currentLesson.evaluations}
          onEvaluation={onEvaluation}
        />
      )}
      {!canEdit && currentLesson?.type === 'assessment' && currentLesson.assessment && (
        <CourseAssessment
          assessment={currentLesson.assessment}
          className={cn('mt-8 border-t-2 pt-6')}
          completed={!!currentLesson.completed}
          onValueChange={onAssessment}
        />
      )}
    </>
  )
}
