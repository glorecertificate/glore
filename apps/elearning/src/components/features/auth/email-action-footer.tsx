import { useTranslations } from 'next-intl'

import { AppleMailIcon } from '@/components/graphics/apple-mail-icon'
import { GmailLogo } from '@/components/graphics/gmail-logo'
import { OutlookLogoIcon } from '@/components/graphics/outlook-logo'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'

export const EmailActionFooter = () => {
  const t = useTranslations('Common')

  return (
    <div className="grid grid-cols-3 gap-2">
      <Button
        asChild
        className="justify-center"
        icon={GmailLogo}
        iconPlacement="left"
        size="lg"
        title={`${t('open')} Gmail`}
        variant="outline"
      >
        <Link href="https://mail.google.com" target="_blank">
          {'Gmail'}
        </Link>
      </Button>
      <Button
        asChild
        className="justify-center"
        icon={OutlookLogoIcon}
        iconPlacement="left"
        size="lg"
        title={`${t('open')} OutlookLogo`}
        variant="outline"
      >
        <Link href="https://outlook.office.com/mail" target="_blank">
          {'OutlookLogo'}
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
        <Link href="message://">{'Mail'}</Link>
      </Button>
    </div>
  )
}
