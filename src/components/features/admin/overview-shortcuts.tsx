import { type Route } from 'next'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { STAT_ACCENTS, type StatAccent } from '@/components/ui/stat-card'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Shortcut {
  accent: StatAccent
  badge?: number
  description: string
  href: Route
  icon: IconName
  label: string
}

export const AdminOverviewShortcuts = ({
  pendingOrganizations,
  waitingCertificates,
}: {
  pendingOrganizations: number
  waitingCertificates: number
}) => {
  const t = useTranslations('Admin.overview')

  const shortcuts: Shortcut[] = [
    {
      accent: 'teal',
      description: t('shortcutUsersHint'),
      href: '/admin/users' as Route,
      icon: 'users',
      label: t('shortcutUsers'),
    },
    {
      accent: 'navy',
      badge: pendingOrganizations,
      description: t('shortcutOrganizationsHint'),
      href: '/admin/organizations?tab=pending' as Route,
      icon: 'building-2',
      label: t('shortcutOrganizations'),
    },
    {
      accent: 'green',
      badge: waitingCertificates,
      description: t('shortcutCertificatesHint'),
      href: '/admin/certificates',
      icon: 'badge-check',
      label: t('shortcutCertificates'),
    },
    {
      accent: 'amber',
      description: t('shortcutAuditHint'),
      href: '/admin/audit',
      icon: 'clipboard-list',
      label: t('shortcutAudit'),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('shortcutsTitle')}</CardTitle>
        <CardDescription>{t('shortcutsDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="-mx-2 flex flex-col">
          {shortcuts.map(({ accent, badge = 0, description, href, icon, label }) => (
            <li key={href}>
              <Link
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-100 hover:bg-surface-hover focus-visible:focus-ring"
                href={href}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg bg-stat-tile text-stat-foreground',
                    STAT_ACCENTS[accent]
                  )}
                >
                  <LucideIcon className="size-4" name={icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{description}</span>
                </span>
                {badge > 0 && (
                  <Badge
                    className={cn('bg-stat-tile font-bold text-stat-foreground', STAT_ACCENTS[accent])}
                    count={badge}
                    variant="ghost"
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
