'use client'

import { useEffect } from 'react'

import { enrollCourse } from '@/actions/courses/progress'

interface CourseEnrollmentProps {
  courseId: number
  language: string
}

export const CourseEnrollment = ({ courseId, language }: CourseEnrollmentProps) => {
  useEffect(() => {
    void enrollCourse(courseId, language)
  }, [courseId, language])

  return null
}
