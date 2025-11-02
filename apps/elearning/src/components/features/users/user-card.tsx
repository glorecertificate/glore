import { useCallback, useMemo } from 'react'

import { LanguagesIcon, MailIcon, MapPinIcon, PencilIcon, ShieldUserIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'

import { type Any } from '@glore/utils/types'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ExternalLink } from '@/components/ui/link'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useIntl } from '@/hooks/use-intl'
import { type User } from '@/lib/data'
import { mapsUrl } from '@/lib/navigation'

export const UserCard = ({ hide = [], user }: { hide?: (keyof User)[]; user: User }) => {
  const { locale } = useIntl()
  const t = useTranslations()
  const format = useFormatter()

  const resolveCountryLabel = useCallback(
    (country: string | null | undefined) => {
      if (!country) return ''
      const key = `Countries.${country}` as Any
      return t.has?.(key) ? t(key) : country.toUpperCase()
    },
    [t]
  )

  const resolveLanguageLabel = useCallback(
    (language: string) => {
      const key = `Languages.${language}` as Any
      return t.has?.(key) ? t(key) : language.toUpperCase()
    },
    [t]
  )

  const location = useMemo(() => {
    if (!(user.city || user.country)) return
    const locations = []
    if (user.city) locations.push(user.city)
    const countryLabel = resolveCountryLabel(user.country)
    if (countryLabel) locations.push(countryLabel)
    return locations.filter(Boolean).join(', ')
  }, [resolveCountryLabel, user.city, user.country])

  const locationUrl = useMemo(() => (location ? mapsUrl(location) : undefined), [location])

  const languages = useMemo(() => {
    if (!user.languages?.length) return
    const langs = user.languages.map((lang: string) => resolveLanguageLabel(lang))
    const list = locale === 'en' ? langs : langs.map((lang: string) => lang.toLowerCase())
    const formatted = String(format.list(list))
    return t('User.speaks', { languages: formatted })
  }, [format, locale, resolveLanguageLabel, t, user.languages])

  const contactTitle = useMemo(() => {
    if (!user.firstName) return
    return t('User.contact', { user: user.firstName })
  }, [t, user.firstName])

  const isVisible = useCallback(
    (key: keyof User) => {
      const isVisibleKey = !hide.includes(key)
      const hasValue = Array.isArray(user[key]) ? user[key]?.length > 0 : Boolean(user[key])
      return isVisibleKey && hasValue
    },
    [hide, user]
  )

  return (
    <div className="flex items-start gap-3">
      <Avatar className="size-7 rounded-full object-cover shadow-sm">
        {user.avatarUrl && <AvatarImage alt={user.fullName ?? ''} src={user.avatarUrl} />}
        <AvatarFallback className="font-semibold text-muted-foreground text-xs">{user.initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1">
            <h4 className="font-semibold text-sm leading-none">{user.fullName}</h4>
            {isVisible('isAdmin') && (
              <Tooltip disableHoverableContent>
                <TooltipTrigger asChild pointerEvents="auto">
                  <ShieldUserIcon className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent size="sm">
                  <span className="text-xs">{t('User.admin')}</span>
                </TooltipContent>
              </Tooltip>
            )}
            {isVisible('isEditor') && (
              <Tooltip disableHoverableContent>
                <TooltipTrigger asChild pointerEvents="auto">
                  <PencilIcon className="size-3" />
                </TooltipTrigger>
                <TooltipContent size="sm">
                  <span className="text-xs">{t('User.editor')}</span>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {isVisible('pronouns') && <small className="text-[11px] text-muted-foreground">{user.pronouns}</small>}
        </div>
        <div className="flex flex-col gap-1.5 text-muted-foreground text-xs">
          {(isVisible('country') || isVisible('city')) && location && (
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="size-3.5" />
              {locationUrl ? (
                <ExternalLink className="text-xs" href={locationUrl} target="_blank" title={t('Common.showOnMaps')}>
                  {location}
                </ExternalLink>
              ) : (
                <span className="wrap-break-word max-w-44">{location}</span>
              )}
            </div>
          )}
          {isVisible('languages') && languages && (
            <div className="flex items-start gap-1.5">
              <LanguagesIcon className="size-3.5 pt-0.5" />
              <span className="wrap-break-word max-w-44">{languages}</span>
            </div>
          )}
          {isVisible('email') && (
            <div className="flex items-center gap-1.5">
              <MailIcon className="size-3.5" />
              <ExternalLink className="text-xs" href={`mailto:${user.email}`} title={contactTitle} variant="underlined">
                {user.email}
              </ExternalLink>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
