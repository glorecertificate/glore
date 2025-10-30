import { useTranslations } from 'next-intl'

import { AppleMailIcon } from '@/components/icons/apple-mail'
import { GmailIcon } from '@/components/icons/gmail'
import { OutlookIcon } from '@/components/icons/outlook'
import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/ui/link'

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
        <ExternalLink href="https://mail.google.com" target="_blank">
          {'Gmail'}
        </ExternalLink>
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
        <ExternalLink href="https://outlook.office.com/mail" target="_blank">
          {'Outlook'}
        </ExternalLink>
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
        <ExternalLink href="message://">{'Mail'}</ExternalLink>
      </Button>
    </div>
  )
}
