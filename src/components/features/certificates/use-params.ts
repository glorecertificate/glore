'use client'

import { startTransition } from 'react'

import { parseAsStringEnum, useQueryState } from 'nuqs'

import {
  CERT_LIST_PARAMS,
  CERT_LIST_SORTS,
  CERT_LIST_STATUS_VALUES,
  type CertListSort,
  type CertListStatus,
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
