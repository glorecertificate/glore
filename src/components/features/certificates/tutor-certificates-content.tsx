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
import { FilterBar } from '@/components/ui/filter-bar'
import { PageHeaderDescription } from '@/components/ui/page-header'
import { SearchInput } from '@/components/ui/search'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toast'
import { type Certificate } from '@/db/queries/certificate'
import { useSearch } from '@/hooks/use-search'
import { SHORTCUTS } from '@/lib/shortcuts'
import { fullName } from '@/lib/utils'

const ALL = 'all'

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

  const filter = (tabKey: TutorQueueTab) =>
    sources[tabKey].filter(certificate => {
      if (!matchSearch([certificate.user ? fullName(certificate.user) : null, certificate.user?.email])) return false
      if (tabKey !== 'pool' && status && certificate.status !== status) return false
      if (!age || !certificate.isPending) return !age
      const tone = ageTone(certificateAge(certificate))
      return age === 'overdue' ? tone === 'overdue' : tone !== 'fresh'
    })

  const statusOptions: readonly string[] = TUTOR_QUEUE_STATUSES[tab]

  const clearFilters = () => {
    setSearch('')
    setStatus(null)
    setAge(null)
  }

  const isFiltered = Boolean(searchValue.trim() || status || age)

  const filters = (
    <FilterBar active={isFiltered} onClear={clearFilters}>
      <SearchInput aria-label={t('search')} hotkey={SHORTCUTS.filter.key} placeholder={t('search')} size="sm" />
      {statusOptions.length > 0 && (
        <Select onValueChange={value => setStatus(value === ALL ? null : value)} value={status ?? ALL}>
          <SelectTrigger aria-label={t('status')} className="w-44" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('allStatuses')}</SelectItem>
            {statusOptions.map(option => (
              <SelectItem key={option} value={option}>
                {tStatus(CERTIFICATE_STATUS[option as keyof typeof CERTIFICATE_STATUS].labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {tab !== 'completed' && (
        <Select onValueChange={value => setAge(value === ALL ? null : (value as TutorQueueAge))} value={age ?? ALL}>
          <SelectTrigger aria-label={t('age')} className="w-44" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('allAges')}</SelectItem>
            {TUTOR_QUEUE_AGES.map(option => (
              <SelectItem key={option} value={option}>
                {t(`age_${option}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FilterBar>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeaderDescription>{t('description')}</PageHeaderDescription>
      <Tabs
        className="gap-4"
        onValueChange={value => {
          setTab(value as TutorQueueTab)
          setSelected([])
          setStatus(null)
          setAge(null)
        }}
        value={tab}
      >
        <TabsList>
          {TUTOR_QUEUE_TABS.map(key => (
            <TabsTrigger key={key} value={key}>
              {t(`tabs.${key}`)}
              <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">{counts[key]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {TUTOR_QUEUE_TABS.map(key => {
          const rows = filter(key)
          return (
            <TabsContent className="flex flex-col gap-3" key={key} value={key}>
              <CertificateQueue
                claiming={claiming}
                filtered={isFiltered}
                filters={filters}
                onClaim={claim}
                onSelectionChange={setSelected}
                rows={rows}
                selectedIds={selected}
                tab={key}
              />
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
