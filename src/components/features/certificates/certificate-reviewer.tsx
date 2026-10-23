'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { assignCertificateTutor, unassignCertificate } from '@/actions/certificates/assignment'
import { LucideIcon } from '@/components/icons/lucide'
import { useSession } from '@/components/providers/session'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type Certificate } from '@/db/queries/certificate'
import { fullName } from '@/lib/utils'

export interface OrgTutor {
  firstName: string | null
  id: string
  lastName: string | null
}

export const CertificateReviewer = ({ certificate, tutors }: { certificate: Certificate; tutors?: OrgTutor[] }) => {
  const t = useTranslations('Certificates')
  const { push, refresh } = useRouter()
  const { user } = useSession()
  const [pending, startTransition] = useTransition()

  const canAssign = Array.isArray(tutors) && certificate.isOpen
  const canRelease = user.isTutor && certificate.reviewerId === user.id && certificate.isOpen && !canAssign

  const run = (work: () => ReturnType<typeof unassignCertificate>, success: string, released = false) =>
    startTransition(async () => {
      const { error } = await work()
      if (error) return void toast.error(t('assignTutorError'))
      toast.success(success)
      if (released) return push('/certificates')
      return refresh()
    })

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-2.5">
      <div className="flex items-center gap-2 text-sm">
        <LucideIcon name="user-check" className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground">
          {t('reviewer')}
          {':'}
        </span>
        <span className="font-medium">
          {certificate.reviewer ? fullName(certificate.reviewer) : t('reviewerUnassigned')}
        </span>
      </div>
      {canAssign &&
        (tutors.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('noTutorsAvailable')}</p>
        ) : (
          <Select
            disabled={pending}
            onValueChange={value =>
              run(
                () => (value ? assignCertificateTutor(certificate.id, value) : unassignCertificate(certificate.id)),
                t('assignTutorSuccess')
              )
            }
            value={certificate.reviewerId ?? ''}
          >
            <SelectTrigger aria-label={t('assignTutor')} className="h-8 w-48">
              <SelectValue placeholder={t('reviewerUnassigned')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('reviewerUnassigned')}</SelectItem>
              {tutors.map(tutor => (
                <SelectItem key={tutor.id} value={tutor.id}>
                  {fullName(tutor)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      {canRelease && (
        <Button
          disabled={pending}
          onClick={() => run(() => unassignCertificate(certificate.id), t('selfReleaseSuccess'), true)}
          size="sm"
          variant="ghost"
        >
          {t('selfRelease')}
        </Button>
      )}
    </div>
  )
}
