'use client'

import { useTranslations } from 'next-intl'

import { CertificateQueue, certificateAge } from '@/components/features/certificates/certificate-queue'
import {
  TUTOR_QUEUE_AGES,
  TUTOR_QUEUE_STATUSES,
  TUTOR_QUEUE_TABS,
  type TutorQueueAge,
  type TutorQueueTab,
} from '@/components/features/certificates/params'
import { ageTone } from '@/components/features/certificates/rules'
import { useTutorQueueAge, useTutorQueueStatus, useTutorQueueTab } from '@/components/features/certificates/use-params'
import { SearchInput } from '@/components/ui/search'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type Certificate } from '@/db/queries/certificate'
import { useSearch } from '@/hooks/use-search'
import { fullName } from '@/lib/utils'

const ALL = 'all'

const STATUS_LABEL_KEYS = {
  approved: 'statusApproved',
  changes_requested: 'statusChangesRequested',
  in_review: 'statusInReview',
  rejected: 'statusRejected',
  revoked: 'statusRevoked',
  submitted: 'statusSubmitted',
  withdrawn: 'statusWithdrawn',
} as const

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
  const { matchSearch } = useSearch()

  const open = assigned.filter(({ isOpen }) => isOpen)
  const completed = assigned.filter(({ isOpen }) => !isOpen)
  const sources = { assigned: open, completed, pool: unassigned } satisfies Record<TutorQueueTab, Certificate[]>
  const counts = {
    assigned: open.length,
    completed: completed.length,
    pool: unassigned.length,
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

  const filters = (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput aria-label={t('search')} placeholder={t('search')} />
      {statusOptions.length > 0 && (
        <Select onValueChange={value => setStatus(value === ALL ? null : value)} value={status ?? ALL}>
          <SelectTrigger aria-label={t('status')} className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('allStatuses')}</SelectItem>
            {statusOptions.map(option => (
              <SelectItem key={option} value={option}>
                {tStatus(STATUS_LABEL_KEYS[option as keyof typeof STATUS_LABEL_KEYS])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {tab !== 'completed' && (
        <Select onValueChange={value => setAge(value === ALL ? null : (value as TutorQueueAge))} value={age ?? ALL}>
          <SelectTrigger aria-label={t('age')} className="w-44">
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
    </div>
  )

  return (
    <Tabs
      className="gap-4 py-6"
      onValueChange={value => {
        setTab(value as TutorQueueTab)
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
      {TUTOR_QUEUE_TABS.map(key => (
        <TabsContent key={key} value={key}>
          <CertificateQueue filters={filters} rows={filter(key)} tab={key} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
