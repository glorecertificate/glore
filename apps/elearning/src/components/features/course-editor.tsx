'use client'

import { useCallback, useMemo, useState } from 'react'

import { type Course, type Lesson } from '@/api/modules/courses/types'
import { CourseHeaderMobile } from '@/components/features/course-header-mobile'
import { CourseSidebar } from '@/components/features/course-sidebar'

export const CourseEditor = ({ course: initial }: { course?: Course }) => {
  const [course, _setCourse] = useState<Course | Partial<Course>>(initial || {})
  const [infoVisible, setInfoVisible] = useState(true)
  const [step, setStepState] = useState<number | undefined>(undefined)

  const setStep = useCallback(
    (step: number) => {
      setInfoVisible(false)
      setStepState(step)
    },
    [setInfoVisible, setStepState],
  )

  const showInfo = useCallback(() => {
    setInfoVisible(true)
    setStepState(undefined)
  }, [setInfoVisible, setStepState])

  const lesson = useMemo<Lesson | Partial<Lesson> | undefined>(
    () => (course.lessons?.length === 0 || step === undefined ? ({} as Partial<Lesson>) : course.lessons?.[step]),
    [step, course.lessons],
  )

  const componentProps = useMemo(
    () => ({
      course,
      lesson,
      step,
      editable: true,
      setStep,
    }),
    [course, lesson, step, setStep],
  )

  return (
    <div className="container mx-auto flex flex-1 px-8 pb-8">
      <CourseSidebar infoVisible={infoVisible} showInfo={showInfo} {...componentProps} />
      <div>
        <CourseHeaderMobile {...componentProps} />
        {infoVisible && <p>{'info'}</p>}
      </div>
    </div>
  )
}
