export const CERT_LIST_PARAMS = {
  SORT: 'sort',
  STATUS: 'status',
} as const

export const CERT_LIST_STATUS_VALUES = ['draft', 'submitted', 'in_review', 'changes_requested', 'approved'] as const

export type CertListStatus = (typeof CERT_LIST_STATUS_VALUES)[number]

export const CERT_LIST_SORTS = ['newest', 'oldest'] as const

export type CertListSort = (typeof CERT_LIST_SORTS)[number]
