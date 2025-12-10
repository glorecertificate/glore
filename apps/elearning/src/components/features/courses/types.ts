import type { Enum } from '@glore/utils/types'

export enum CourseListEditorView {
  All = 'all',
  Published = 'published',
  Partial = 'partial',
  Draft = 'draft',
  Archived = 'archived',
}

export enum CourseListLearnerView {
  All = 'all',
  NotStarted = 'not_started',
  InProgress = 'in_progress',
  Completed = 'completed',
}

export type CourseListView = Enum<CourseListEditorView | CourseListLearnerView>

export enum CourseMode {
  Editor = 'editor',
  Preview = 'preview',
  Student = 'student',
}

export interface CourseLanguageStatus {
  canSave: boolean
  hasContent: boolean
  hasContentUpdates: boolean
  hasTitle: boolean
  hasTitleUpdates: boolean
  hasUpdates: boolean
  isFullfilled: boolean
  published: boolean
}

export type LessonType = 'reading' | 'assessment' | 'evaluations' | 'questions'
