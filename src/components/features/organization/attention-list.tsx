'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useFormatter, useTranslations } from 'next-intl'

import { resendOrganizationInvitation } from '@/actions/organizations/invitations'
import { useInvitationError } from '@/components/features/organization/use-invitation-error'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { toast } from '@/components/ui/toast'
import { timestampMillis } from '@/db/queries/organization'
import { type AttentionItem } from '@/db/queries/organization-attention'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

const ICONS = {
  changes: 'award',
  expired: 'mail',
  request: 'users',
} as const satisfies Record<AttentionItem['kind'], IconName>

export const AttentionList = ({
  className,
  items,
  organization,
}: {
  className?: string
  items: AttentionItem[]
  organization: string
}) => {
  const t = useTranslations('OrganizationAttention')
  const tInvitations = useTranslations('Invitations')
  const errorMessage = useInvitationError()
  const { dateTime } = useFormatter()
  const { refresh } = useRouter()
  const [busy, setBusy] = useState<number | null>(null)

  const date = (value: string) => dateTime(new Date(timestampMillis(value)), { dateStyle: 'medium' })

  const resend = async (id: number, email: string) => {
    setBusy(id)
    const { error } = await resendOrganizationInvitation(id)
    setBusy(null)
    if (error) {
      toast.error(errorMessage(error.code))
      return
    }
    toast.success(tInvitations('resent', { email }))
    refresh()
  }

  const row = (item: AttentionItem) => {
    if (item.kind === 'request') {
      return {
        action: (
          <Button asChild size="sm" variant="outline">
            <Link href="/organization?tab=requests">{t('reviewRequest')}</Link>
          </Button>
        ),
        context: t('requestContext', { date: date(item.at) }),
        title: t('requestTitle', { name: item.name, organization }),
      }
    }
    if (item.kind === 'changes') {
      return {
        action: (
          <Button asChild size="sm" variant="outline">
            <Link href={`/certificates/${item.id}`}>{t('openCertificate')}</Link>
          </Button>
        ),
        context: item.tutor
          ? t('changesContext', { date: date(item.at), tutor: item.tutor })
          : t('changesContextUnnamed', { date: date(item.at) }),
        title: t('changesTitle', { holder: item.holder }),
      }
    }
    return {
      action: (
        <Button
          loading={busy === item.id}
          onClick={() => resend(item.id, item.email)}
          size="sm"
          type="button"
          variant="outline"
        >
          {t('resend')}
        </Button>
      ),
      context: t('expiredContext', { date: date(item.at) }),
      title: t('expiredTitle', { email: item.email }),
    }
  }

  return (
    <Card className={cn('gap-0 p-0', className)} data-slot="attention-list">
      <CardHeader className="items-center p-5">
        <CardTitle>{t('title')}</CardTitle>
        {items.length > 0 && (
          <CardAction className="row-span-1 self-center type-caption text-fg-2">
            {t('count', { count: items.length })}
          </CardAction>
        )}
      </CardHeader>
      {items.length === 0 && (
        <p className="border-t border-border-subtle px-5 py-6 text-sm text-muted-foreground">{t('empty')}</p>
      )}
      {items.length > 0 && (
        <ul className="divide-y divide-border-subtle border-t border-border-subtle">
          {items.map(item => {
            const { action, context, title } = row(item)
            return (
              <li
                className="flex flex-wrap items-start gap-x-3 gap-y-2.5 px-5 py-3.5 sm:flex-nowrap sm:items-center sm:gap-x-4"
                key={`${item.kind}-${item.id}`}
              >
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning-subtle text-warning-text"
                >
                  <LucideIcon className="size-4" name={ICONS[item.kind]} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate text-sm font-medium text-fg-title max-sm:whitespace-normal">{title}</p>
                  <p className="truncate type-caption text-fg-2 max-sm:whitespace-normal">{context}</p>
                </div>
                <div className="shrink-0 max-sm:basis-full max-sm:pl-11">{action}</div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
