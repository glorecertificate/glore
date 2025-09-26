import { useTranslations } from '@repo/i18n'
import { Button } from '@repo/ui/components/button'
import { AppleMailIcon } from '@repo/ui/icons/apple-mail'
import { GmailIcon } from '@repo/ui/icons/gmail'
import { OutlookIcon } from '@repo/ui/icons/outlook'

import { Link } from '@/components/ui/link'

const GMAIL_URL = 'https://mail.google.com/mail'
const OUTLOOK_URL = 'https://outlook.live.com/mail'
const APPLE_MAIL_URL = 'message:'

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
        <Link href={GMAIL_URL} target="_blank">
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
        <Link href={OUTLOOK_URL} target="_blank">
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
        <Link href={APPLE_MAIL_URL}>{'Mail'}</Link>
      </Button>
    </div>
  )
}
