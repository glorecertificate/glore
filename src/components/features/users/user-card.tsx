import { LanguagesIcon, MailIcon, MapPinIcon, PencilIcon, ShieldUserIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Link } from '@/components/ui/link'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type User } from '@/db/queries/user'
import { useI18n } from '@/hooks/use-i18n'
import { type Any, type HttpUrl } from '@/lib/types'
import app from '~/config/app.json'

const DEFAULT_HIDE: (keyof User)[] = []

export const UserCard = ({ hide = DEFAULT_HIDE, user }: { hide?: (keyof User)[]; user: User }) => {
  const { locale } = useI18n()
  const tCommon = useTranslations('Common')
  const t = useTranslations('Users')
  const tCountries = useTranslations('Intl.Countries')
  const tLanguages = useTranslations('Intl.Languages')
  const format = useFormatter()

  const resolveCountryLabel = (country: string | null | undefined) => {
    if (!country) return ''
    const key = country as Any
    return tCountries.has?.(key) ? tCountries(key) : country.toUpperCase()
  }

  const resolveLanguageLabel = (language: string) => {
    const key = language as Any
    return tLanguages.has?.(key) ? tLanguages(key) : language.toUpperCase()
  }

  const location = (() => {
    if (!(user.city || user.country)) return
    const locations = []
    if (user.city) locations.push(user.city)
    const countryLabel = resolveCountryLabel(user.country)
    if (countryLabel) locations.push(countryLabel)
    return locations.filter(Boolean).join(', ')
  })()

  const locationUrl = (() => {
    if (!location) return
    const searchQuery = location.replace(/[^a-zA-Z0-9]+/gu, '+').replace(/\++/gu, '+')
    return `${app.mapsUrl}/${searchQuery}` as HttpUrl
  })()

  const languages = (() => {
    if (!user.languages?.length) return
    const langs = user.languages.map((lang: string) => resolveLanguageLabel(lang))
    const list = locale === 'en' ? langs : langs.map((lang: string) => lang.toLowerCase())
    if (list.length <= 3) return t('speaks', { languages: String(format.list(list)) })
    const [first, second] = list
    return t('speaksMany', { first, second, count: list.length - 2 })
  })()

  const contactTitle = (() => {
    if (!user.firstName) return
    return t('contact', { user: user.firstName })
  })()

  const isVisible = (key: keyof User) => {
    const isVisibleKey = !hide.includes(key)
    const hasValue = Array.isArray(user[key]) ? user[key]?.length > 0 : Boolean(user[key])
    return isVisibleKey && hasValue
  }

  return (
    <div className="flex items-start gap-3">
      <Avatar className="size-7 rounded-full object-cover shadow-sm">
        {user.avatarUrl && <AvatarImage alt={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} />}
        <AvatarFallback className="text-xs font-semibold text-muted-foreground">{user.initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1">
            <h4 className="text-sm leading-none font-semibold">{`${user.firstName} ${user.lastName}`}</h4>
            {isVisible('isAdmin') && (
              <Tooltip disableHoverableContent>
                <TooltipTrigger asChild pointerEvents="auto">
                  <ShieldUserIcon className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent sideOffset={8} size="sm">
                  <span className="text-xs">{t('admin')}</span>
                </TooltipContent>
              </Tooltip>
            )}
            {isVisible('isEditor') && (
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
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          {(isVisible('country') || isVisible('city')) && location && (
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="size-3.5" />
              {locationUrl ? (
                <Link className="text-xs" href={locationUrl} target="_blank" title={tCommon('showOnMaps')}>
                  {location}
                </Link>
              ) : (
                <span className="max-w-44 wrap-break-word">{location}</span>
              )}
            </div>
          )}
          {isVisible('languages') && languages && (
            <div className="flex items-start gap-1.5">
              <LanguagesIcon className="size-3.5 pt-0.5" />
              <span className="max-w-44 wrap-break-word">{languages}</span>
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
