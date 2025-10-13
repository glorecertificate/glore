import { useTranslations } from 'next-intl'

import { AppleMailIcon } from '@/components/icons/apple-mail'
import { GmailIcon } from '@/components/icons/gmail'
import { OutlookIcon } from '@/components/icons/outlook'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { buildExternalRoute } from '@/lib/navigation'

export const EmailClientsFooter = () => {
  const t = useTranslations('Common')

  return (
    <div className="grid grid-cols-3 gap-2">
      <Button
        asChild
        className="justify-center"
        icon={GmailIcon}
        iconPlacement="left"
        size="lg"
        title={`${t('open')} Gmail`}
        variant="outline"
      >
        <Link href={buildExternalRoute('gmail')} target="_blank">
          {'Gmail'}
        </Link>
      </Button>
      <Button
        asChild
        className="justify-center"
        icon={OutlookIcon}
        iconPlacement="left"
        size="lg"
        title={`${t('open')} Outlook`}
        variant="outline"
      >
        <Link href={buildExternalRoute('outlook')} target="_blank">
          {'Outlook'}
        </Link>
      </Button>
      <Button
        asChild
        className="justify-center [&_svg]:size-5!"
        icon={AppleMailIcon}
        iconPlacement="left"
        size="lg"
        title={t('openDefaultEmailClient')}
        variant="outline"
      >
        <Link href={buildExternalRoute('apple-mail')}>{'Mail'}</Link>
      </Button>
    </div>
  )
}
