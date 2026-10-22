export const CERT_LIST_PARAMS = {
  SORT: 'sort',
  STATUS: 'status',
} as const

export const CERT_LIST_STATUS_VALUES = [
  'draft',
  'submitted',
  'in_review',
  'changes_requested',
  'approved',
  'rejected',
  'withdrawn',
  'revoked',
] as const

export type CertListStatus = (typeof CERT_LIST_STATUS_VALUES)[number]

export const CERT_LIST_SORTS = ['newest', 'oldest'] as const

export type CertListSort = (typeof CERT_LIST_SORTS)[number]

export const TUTOR_QUEUE_PARAMS = {
  AGE: 'age',
  QUERY: 'q',
  STATUS: 'status',
  TAB: 'tab',
} as const

export const TUTOR_QUEUE_TABS = ['assigned', 'pool', 'completed'] as const

export type TutorQueueTab = (typeof TUTOR_QUEUE_TABS)[number]

export const TUTOR_QUEUE_AGES = ['due', 'overdue'] as const

export type TutorQueueAge = (typeof TUTOR_QUEUE_AGES)[number]

export const TUTOR_QUEUE_STATUSES = {
  assigned: ['submitted', 'in_review', 'changes_requested'],
  completed: ['approved', 'rejected', 'revoked', 'withdrawn'],
  pool: [],
} as const satisfies Record<TutorQueueTab, readonly string[]>
