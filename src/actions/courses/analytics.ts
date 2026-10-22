'use server'

import 'server-only'

import { findCourseAnalytics } from '@/actions/courses/data'
import { requireEditor } from '@/actions/guards'

export const getCourseAnalytics = async (courseId: number) => {
  try {
    await requireEditor()
  } catch {
    return { error: { code: 'UNAUTHORIZED', message: 'Not authorized' } }
  }

  try {
    return { data: await findCourseAnalytics(courseId) }
  } catch {
    return { error: { code: 'QUERY_FAILED', message: 'Analytics could not be loaded' } }
  }
}
