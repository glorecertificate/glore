import { type CourseSummary } from '@/db/queries/course'

interface CourseViewer {
  canEdit: boolean
  isLearner: boolean
  isVolunteer: boolean
}

export const isListedCourse = (course: Pick<CourseSummary, 'publicationStatus' | 'type'>, user: CourseViewer) => {
  if (user.canEdit) return true
  if (course.publicationStatus === 'draft' || course.publicationStatus === 'archived') return false
  if (user.isLearner && course.type === 'skill') return false
  return !(user.isVolunteer && course.type === 'learner')
}
