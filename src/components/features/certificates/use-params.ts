'use client'

import { startTransition } from 'react'

import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs'

import {
  CERT_LIST_PARAMS,
  CERT_LIST_SORTS,
  CERT_LIST_STATUS_VALUES,
  type CertListSort,
  type CertListStatus,
  TUTOR_QUEUE_AGES,
  TUTOR_QUEUE_PARAMS,
  TUTOR_QUEUE_TABS,
  type TutorQueueAge,
  type TutorQueueTab,
} from '@/components/features/certificates/params'

const paramsOptions = { history: 'push', startTransition } as const

const statusParser = parseAsStringEnum([...CERT_LIST_STATUS_VALUES])
const sortParser = parseAsStringEnum([...CERT_LIST_SORTS]).withDefault('newest')

export const useCertListStatus = () => {
  const [status, setStatusRaw] = useQueryState(CERT_LIST_PARAMS.STATUS, { ...statusParser, ...paramsOptions })
  const setStatus = (s: CertListStatus | null) => setStatusRaw(s)
  return { setStatus, status }
}

export const useCertListSort = () => {
  const [sort, setSortRaw] = useQueryState(CERT_LIST_PARAMS.SORT, { ...sortParser, ...paramsOptions })
  const setSort = (s: CertListSort | null) => setSortRaw(s)
  return { setSort, sort }
}

const tabParser = parseAsStringEnum([...TUTOR_QUEUE_TABS]).withDefault('assigned')
const ageParser = parseAsStringEnum([...TUTOR_QUEUE_AGES])

export const useTutorQueueTab = () => {
  const [tab, setTabRaw] = useQueryState(TUTOR_QUEUE_PARAMS.TAB, { ...tabParser, ...paramsOptions })
  const setTab = (value: TutorQueueTab) => setTabRaw(value)
  return { setTab, tab }
}

export const useTutorQueueAge = () => {
  const [age, setAgeRaw] = useQueryState(TUTOR_QUEUE_PARAMS.AGE, { ...ageParser, ...paramsOptions })
  const setAge = (value: TutorQueueAge | null) => setAgeRaw(value)
  return { age, setAge }
}

export const useTutorQueueStatus = () => {
  const [status, setStatusRaw] = useQueryState(TUTOR_QUEUE_PARAMS.STATUS, parseAsString.withOptions(paramsOptions))
  const setStatus = (value: string | null) => setStatusRaw(value)
  return { setStatus, status }
}
