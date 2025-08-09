import { useCallback, useMemo } from 'react'

import { LanguagesIcon, MailIcon, MapPin, PencilIcon, ShieldUserIcon } from 'lucide-react'
import { useFormatter } from 'use-intl'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Link } from '@/components/ui/link'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useLocale } from '@/hooks/use-locale'
import { useTranslations } from '@/hooks/use-translations'
import { type User } from '@/lib/api/modules/users/types'
import { googleMapsUrl } from '@/lib/navigation'

export const UserCard = ({ hide = [], user }: { hide?: (keyof User)[]; user: User }) => {
  const { locale } = useLocale()
  const t = useTranslations()
  const format = useFormatter()

  const location = useMemo(() => {
    if (!user.city && !user.country) return undefined
    const locations = []
    if (user.city) locations.push(user.city)
    if (user.country) locations.push(t.flat(`Countries.${user.country}`))
    return locations.filter(Boolean).join(', ')
  }, [t, user.city, user.country])

  const locationUrl = useMemo(() => {
    if (!location) return undefined
    return googleMapsUrl(location)
  }, [location])

  const languages = useMemo(() => {
    const langs = user.languages!.map(lang => t.flat(`Languages.${lang}`))
    const list = locale === 'en' ? langs : langs.map(lang => lang.toLowerCase())
    return t('User.speaks', { languages: format.list(list) })
  }, [format, locale, t, user.languages])

  const contactTitle = useMemo(() => {
    if (!user.firstName) return undefined
    return t('User.contact', { user: user.firstName })
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
      <Avatar className="size-7 rounded-full object-cover shadow-sm">
        {user.avatarUrl && <AvatarImage alt={user.fullName ?? ''} src={user.avatarUrl} />}
        <AvatarFallback className="text-xs font-semibold text-muted-foreground">{user.initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5">
            <h4 className="text-sm leading-none font-semibold">{user.fullName}</h4>
            {isVisible('isAdmin') && (
              <Tooltip>
                <TooltipTrigger asChild pointerEvents="auto">
                  <ShieldUserIcon className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent sideOffset={3}>
                  <span className="text-xs">{t('User.admin')}</span>
                </TooltipContent>
              </Tooltip>
            )}
            {isVisible('isEditor') && (
              <Tooltip>
                <TooltipTrigger asChild pointerEvents="auto">
                  <PencilIcon className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent sideOffset={3}>
                  <span className="text-xs">{t('User.editor')}</span>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {isVisible('pronouns') && <small className="text-xs text-muted-foreground">{user.pronouns}</small>}
        </div>
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          {(isVisible('country') || isVisible('city')) && location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {locationUrl ? (
                <Link href={locationUrl} size="sm" target="_blank" title={t('Common.showOnGoogleMaps')}>
                  {location}
                </Link>
              ) : (
                <span className="max-w-44 break-words">{location}</span>
              )}
            </div>
          )}
          {isVisible('languages') && (
            <div className="flex items-start gap-1.5">
              <LanguagesIcon className="size-3.5 pt-0.5" />
              <span className="max-w-44 break-words">{languages}</span>
            </div>
          )}
          {isVisible('email') && (
            <div className="flex items-center gap-1.5">
              <MailIcon className="size-3.5" />
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
