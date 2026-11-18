'use client'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Link } from '@/components/ui/link'

export const NoOrganization = () => {
  const t = useTranslations('Dashboard')
  const tLayout = useTranslations('Layout')

  return (
    <div className="flex flex-1 flex-col gap-8">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LucideIcon name="building" />
          </EmptyMedia>
          <EmptyTitle>{tLayout('noOrganization')}</EmptyTitle>
          <EmptyDescription>{t('none.description')}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline">
            <Link prefetch href="/help">
              {t('none.help')}
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
