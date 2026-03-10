export const COURSE_LIST_PARAMS = {
  LANGUAGES: 'lang',
  SKILL_GROUPS: 'groups',
  SORT: 'sort',
  SORT_DIRECTION: 'dir',
  TAB: 'tab',
  TYPES: 'types',
} as const

export const COURSE_LIST_EDITOR_TABS = ['all', 'published', 'partial', 'draft', 'archived'] as const
export const COURSE_LIST_LEARNER_TABS = ['all', 'notStarted', 'inProgress', 'completed'] as const
export const COURSE_LIST_TABS = [...COURSE_LIST_EDITOR_TABS, ...COURSE_LIST_LEARNER_TABS]

export type CourseListTab = (typeof COURSE_LIST_EDITOR_TABS | typeof COURSE_LIST_LEARNER_TABS)[number]

export const COURSE_LIST_EDITOR_SORTS = ['name', 'type', 'skillGroup', 'creation', 'update'] as const
export const COURSE_LIST_LEARNER_SORTS = ['progress', 'type', 'skillGroup', 'name'] as const
export const COURSE_LIST_SORTS = [...COURSE_LIST_EDITOR_SORTS, ...COURSE_LIST_LEARNER_SORTS]

export type CourseListSortType = (typeof COURSE_LIST_EDITOR_SORTS | typeof COURSE_LIST_LEARNER_SORTS)[number]
export type CourseListSortDirection = 'asc' | 'desc'
