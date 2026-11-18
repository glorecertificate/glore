'use client'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Link } from '@/components/ui/link'
import { PageHeader, PageHeaderHeading, PageHeaderTitle } from '@/components/ui/page-header'

export const NoOrganization = ({ firstName }: { firstName: string }) => {
  const t = useTranslations('Dashboard')
  const tLayout = useTranslations('Layout')

  return (
    <div className="flex flex-1 flex-col gap-8">
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>{t('none.title', { name: firstName })}</PageHeaderTitle>
        </PageHeaderHeading>
      </PageHeader>
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
            <Link href="/help">{t('none.help')}</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
