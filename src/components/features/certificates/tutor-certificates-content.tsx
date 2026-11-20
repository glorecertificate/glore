'use client'

import { useRouter } from 'next/navigation'
import { useOptimistic, useState, useTransition } from 'react'

import { useTranslations } from 'next-intl'

import { selfAssignCertificate } from '@/actions/certificates/assignment'
import { CertificateQueue, certificateAge } from '@/components/features/certificates/certificate-queue'
import { failedClaims } from '@/components/features/certificates/claim'
import {
  TUTOR_QUEUE_AGES,
  TUTOR_QUEUE_STATUSES,
  TUTOR_QUEUE_TABS,
  type TutorQueueAge,
  type TutorQueueTab,
} from '@/components/features/certificates/params'
import { ageTone } from '@/components/features/certificates/rules'
import { CERTIFICATE_STATUS } from '@/components/features/certificates/status'
import { useTutorQueueAge, useTutorQueueStatus, useTutorQueueTab } from '@/components/features/certificates/use-params'
import { type FilterRailProps } from '@/components/ui/filter-rail'
import { SearchInput } from '@/components/ui/search'
import { toast } from '@/components/ui/toast'
import { type Certificate } from '@/db/queries/certificate'
import { useSearch } from '@/hooks/use-search'
import { SHORTCUTS } from '@/lib/shortcuts'
import { fullName } from '@/lib/utils'

const ageMatches = (certificate: Certificate, option: TutorQueueAge) => {
  if (!certificate.isPending) return false
  const tone = ageTone(certificateAge(certificate))
  return option === 'overdue' ? tone === 'overdue' : tone !== 'fresh'
}

export const TutorCertificatesContent = ({
  assigned,
  unassigned,
}: {
  assigned: Certificate[]
  unassigned: Certificate[]
}) => {
  const t = useTranslations('CertificateQueue')
  const tStatus = useTranslations('CertificateStatus')
  const { setTab, tab } = useTutorQueueTab()
  const { setStatus, status } = useTutorQueueStatus()
  const { age, setAge } = useTutorQueueAge()
  const { matchSearch, searchValue, setSearch } = useSearch()
  const { refresh } = useRouter()
  const [pool, hide] = useOptimistic(unassigned, (list, ids: number[]) => list.filter(({ id }) => !ids.includes(id)))
  const [claiming, startClaim] = useTransition()
  const [selected, setSelected] = useState<number[]>([])

  const claim = (ids: number[]) =>
    startClaim(async () => {
      hide(ids)
      setSelected(current => current.filter(id => !ids.includes(id)))
      const failed = await failedClaims(ids, selfAssignCertificate)
      if (failed.length > 0) {
        setSelected(current => [...current, ...failed.filter(id => !current.includes(id))])
        toast.error(t('claimError', { count: failed.length }))
      }
      if (failed.length < ids.length) toast.success(t('claimSuccess', { count: ids.length - failed.length }))
      refresh()
    })

  const open = assigned.filter(({ isOpen }) => isOpen)
  const completed = assigned.filter(({ isOpen }) => !isOpen)
  const sources = { assigned: open, completed, pool } satisfies Record<TutorQueueTab, Certificate[]>
  const counts = {
    assigned: open.length,
    completed: completed.length,
    pool: pool.length,
  } satisfies Record<TutorQueueTab, number>

  const matches = (
    certificate: Certificate,
    tabKey: TutorQueueTab,
    { ignoreAge = false, ignoreStatus = false }: { ignoreAge?: boolean; ignoreStatus?: boolean } = {}
  ) => {
    if (!matchSearch([certificate.user ? fullName(certificate.user) : null, certificate.user?.email])) return false
    if (!ignoreStatus && tabKey !== 'pool' && status.length > 0 && !status.includes(certificate.status)) return false
    if (ignoreAge || !age) return true
    if (!certificate.isPending) return false
    const tone = ageTone(certificateAge(certificate))
    return age === 'overdue' ? tone === 'overdue' : tone !== 'fresh'
  }

  const filter = (tabKey: TutorQueueTab) => sources[tabKey].filter(certificate => matches(certificate, tabKey))

  const statusOptions: readonly string[] = TUTOR_QUEUE_STATUSES[tab]

  const clearFilters = () => {
    setSearch('')
    setStatus(null)
    setAge(null)
  }

  const isFiltered = Boolean(searchValue.trim() || status.length > 0 || age)

  const railFor = (tabKey: TutorQueueTab): FilterRailProps => ({
    groups: [
      {
        id: 'queue',
        label: t('queue'),
        onChange: ([value]: string[]) => {
          if (!value) return
          setTab(value as TutorQueueTab)
          setSelected([])
          setStatus(null)
          setAge(null)
        },
        options: TUTOR_QUEUE_TABS.map(key => ({ count: counts[key], label: t(`tabs.${key}`), value: key })),
        selection: 'required' as const,
        values: [tabKey],
      },
      ...(statusOptions.length > 0
        ? [
            {
              id: 'status',
              label: t('status'),
              onChange: (values: string[]) => setStatus(values),
              options: statusOptions.map(option => {
                const meta = CERTIFICATE_STATUS[option as keyof typeof CERTIFICATE_STATUS]
                return {
                  count: sources[tabKey].filter(
                    certificate => certificate.status === option && matches(certificate, tabKey, { ignoreStatus: true })
                  ).length,
                  label: tStatus(meta.labelKey),
                  tone: meta.tone,
                  value: option,
                }
              }),
              values: status,
            },
          ]
        : []),
      ...(tabKey === 'completed'
        ? []
        : [
            {
              id: 'age',
              label: t('age'),
              onChange: ([value]: string[]) => setAge((value as TutorQueueAge | undefined) ?? null),
              options: TUTOR_QUEUE_AGES.map(option => ({
                count: sources[tabKey].filter(
                  certificate => ageMatches(certificate, option) && matches(certificate, tabKey, { ignoreAge: true })
                ).length,
                label: t(`age_${option}`),
                value: option,
              })),
              selection: 'single' as const,
              values: age ? [age] : [],
            },
          ]),
    ],
    onReset: clearFilters,
    search: placement => (
      <SearchInput
        aria-label={t('search')}
        className="w-full"
        hotkey={placement === 'panel' ? SHORTCUTS.filter.key : undefined}
        placeholder={t('search')}
        size="sm"
      />
    ),
    searchActive: Boolean(searchValue.trim()),
  })

  return (
    <CertificateQueue
      claiming={claiming}
      filtered={isFiltered}
      onClaim={claim}
      onSelectionChange={setSelected}
      rail={railFor(tab)}
      rows={filter(tab)}
      selectedIds={selected}
      tab={tab}
    />
  )
}
