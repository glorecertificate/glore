import { useCallback, useMemo } from 'react'

import { LanguagesIcon, MailIcon, MapPin, ShieldUserIcon } from 'lucide-react'
import { useFormatter } from 'use-intl'

import { type User } from '@/api/modules/users/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Link } from '@/components/ui/link'
import { useLocale } from '@/hooks/use-locale'
import { useTranslations } from '@/hooks/use-translations'
import { googleMapsUrl } from '@/lib/navigation'

export const UserCard = ({ hide = [], user }: { hide?: Array<keyof User>; user: User }) => {
  const { locale } = useLocale()
  const t = useTranslations()
  const f = useFormatter()

  const languages = useMemo(() => {
    const langs = user.languages!.map(lang => t.flat(`Languages.${lang}`))
    const list = locale === 'en' ? langs : langs.map(lang => lang.toLowerCase())
    return t('User.speaks', {
      languages: f.list(list),
    })
  }, [f, locale, t, user.languages])

  const contactTitle = useMemo(() => {
    if (!user.firstName) return undefined
    return t('User.contact', {
      user: user.firstName,
    })
  }, [t, user.firstName])

  const isVisible = useCallback(
    (key: keyof User) => {
      const isVisibleKey = !hide.includes(key)
      const hasValue = Array.isArray(user[key]) ? user[key]?.length > 0 : Boolean(user[key])
      return isVisibleKey && hasValue
    },
    [hide, user],
  )

  return (
    <div className="flex items-start gap-3">
      <Avatar className="size-7 rounded-full shadow-sm">
        {user.avatarUrl && <AvatarImage alt={user.fullName ?? ''} src={user.avatarUrl} />}
        <AvatarFallback className="text-base font-semibold">{user.initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            <h4 className="text-sm leading-none font-semibold">{user.fullName}</h4>
            {isVisible('pronouns') && <small className="text-xs text-muted-foreground">{user.pronouns}</small>}
          </div>
          {isVisible('isAdmin') && (
            <Badge color="secondary" size="xs">
              <ShieldUserIcon />
              {t('Common.admin')}
            </Badge>
          )}
          {isVisible('isEditor') && (
            <Badge size="xs">
              <ShieldUserIcon />
              {t('Common.editor')}
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          {isVisible('publicLocation') && (
            <div className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              <Link
                href={googleMapsUrl(user.publicLocation!)}
                size="sm"
                target="_blank"
                title={t('Common.showOnGoogleMaps')}
              >
                {user.publicLocation}
              </Link>
            </div>
          )}
          {isVisible('languages') && (
            <div className="flex items-center gap-1.5">
              <LanguagesIcon className="size-4" />
              <span>{languages}</span>
            </div>
          )}
          {isVisible('email') && (
            <div className="flex items-center gap-1.5">
              <MailIcon className="size-4" />
              <Link href={`mailto:${user.email}`} size="sm" title={contactTitle} variant="underline">
                {user.email}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
