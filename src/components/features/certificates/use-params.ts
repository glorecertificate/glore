'use client'

import { startTransition } from 'react'

import { parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringEnum, useQueryState } from 'nuqs'

import {
  CERT_LIST_PARAMS,
  CERT_LIST_STATUS_VALUES,
  type CertListStatus,
  TUTOR_QUEUE_AGES,
  TUTOR_QUEUE_PARAMS,
  TUTOR_QUEUE_TABS,
  type TutorQueueAge,
  type TutorQueueTab,
} from '@/components/features/certificates/params'

const paramsOptions = { history: 'push', startTransition } as const

const statusParser = parseAsStringEnum([...CERT_LIST_STATUS_VALUES])
const orgParser = parseAsInteger

export const useCertListStatus = () => {
  const [status, setStatusRaw] = useQueryState(CERT_LIST_PARAMS.STATUS, { ...statusParser, ...paramsOptions })
  const setStatus = (s: CertListStatus | null) => setStatusRaw(s)
  return { setStatus, status }
}

export const useCertListOrg = () => {
  const [org, setOrgRaw] = useQueryState(CERT_LIST_PARAMS.ORG, { ...orgParser, ...paramsOptions })
  const setOrg = (value: number | null) => setOrgRaw(value)
  return { org, setOrg }
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
  const [rawStatus, setStatusRaw] = useQueryState(
    TUTOR_QUEUE_PARAMS.STATUS,
    parseAsArrayOf(parseAsString).withOptions(paramsOptions)
  )
  const setStatus = (values: string[] | null) => setStatusRaw(values && values.length > 0 ? values : null)
  return { setStatus, status: rawStatus ?? [] }
}
