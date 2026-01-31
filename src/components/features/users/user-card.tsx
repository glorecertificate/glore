import { useCallback, useMemo } from 'react'

import { LanguagesIcon, MailIcon, MapPinIcon, PencilIcon, ShieldUserIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'

import settings from '~/config/settings.json'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Link } from '@/components/ui/link'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type User } from '@/db/queries/user'
import { useI18n } from '@/hooks/use-i18n'
import { type Any, type HttpUrl } from '@/lib/types'

export const UserCard = ({ hide = [], user }: { hide?: (keyof User)[]; user: User }) => {
  const { locale } = useI18n()
  const tCommon = useTranslations('Common')
  const t = useTranslations('Users')
  const format = useFormatter()

  const resolveCountryLabel = useCallback(
    (country: string | null | undefined) => {
      if (!country) return ''
      const key = `Intl.Countries.${country}` as Any
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

  const locationUrl = useMemo(() => {
    if (!location) return
    const searchQuery = location.replace(/[^a-zA-Z0-9]+/g, '+').replace(/\++/g, '+')
    return `${settings.mapsUrl}/${searchQuery}` as HttpUrl
  }, [location])

  const languages = useMemo(() => {
    if (!user.languages?.length) return
    const langs = user.languages.map((lang: string) => resolveLanguageLabel(lang))
    const list = locale === 'en' ? langs : langs.map((lang: string) => lang.toLowerCase())
    const formatted = String(format.list(list))
    return t('speaks', { languages: formatted })
  }, [format, locale, resolveLanguageLabel, t, user.languages])

  const contactTitle = useMemo(() => {
    if (!user.first_name) return
    return t('contact', { user: user.first_name })
  }, [t, user.first_name])

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
        {user.avatar_url && <AvatarImage alt={`${user.first_name} ${user.last_name}`} src={user.avatar_url} />}
        <AvatarFallback className="font-semibold text-muted-foreground text-xs">{user.initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1">
            <h4 className="font-semibold text-sm leading-none">{`${user.first_name} ${user.last_name}`}</h4>
            {isVisible('is_admin') && (
              <Tooltip disableHoverableContent>
                <TooltipTrigger asChild pointerEvents="auto">
                  <ShieldUserIcon className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent sideOffset={8} size="sm">
                  <span className="text-xs">{t('admin')}</span>
                </TooltipContent>
              </Tooltip>
            )}
            {isVisible('is_editor') && (
              <Tooltip disableHoverableContent>
                <TooltipTrigger asChild pointerEvents="auto">
                  <PencilIcon className="size-3" />
                </TooltipTrigger>
                <TooltipContent sideOffset={8} size="sm">
                  <span className="text-xs">{t('editor')}</span>
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
                <Link className="text-xs" href={locationUrl} target="_blank" title={tCommon('showOnMaps')}>
                  {location}
                </Link>
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
              <Link className="text-xs" href={`mailto:${user.email}`} title={contactTitle} variant="underlined">
                {user.email}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
