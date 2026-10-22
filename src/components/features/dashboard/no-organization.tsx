'use client'

import { BuildingIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Link } from '@/components/ui/link'

export const NoOrganization = ({ firstName }: { firstName: string }) => {
  const t = useTranslations('Dashboard')

  return (
    <div className="flex flex-1 pt-6 pb-10">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BuildingIcon />
          </EmptyMedia>
          <EmptyTitle>{t('none.title', { name: firstName })}</EmptyTitle>
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
