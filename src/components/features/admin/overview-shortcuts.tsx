import { type Route } from 'next'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { type IconName } from '@/lib/types'

interface Shortcut {
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
    { description: t('shortcutUsersHint'), href: '/admin/users' as Route, icon: 'users', label: t('shortcutUsers') },
    {
      badge: pendingOrganizations,
      description: t('shortcutOrganizationsHint'),
      href: '/admin/organizations?tab=pending' as Route,
      icon: 'building-2',
      label: t('shortcutOrganizations'),
    },
    {
      badge: waitingCertificates,
      description: t('shortcutCertificatesHint'),
      href: '/admin/certificates',
      icon: 'badge-check',
      label: t('shortcutCertificates'),
    },
    { description: t('shortcutAuditHint'), href: '/admin/audit', icon: 'clipboard-list', label: t('shortcutAudit') },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('shortcutsTitle')}</CardTitle>
        <CardDescription>{t('shortcutsDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {shortcuts.map(({ badge = 0, description, href, icon, label }) => (
            <li key={href}>
              <Link className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted/50" href={href}>
                <LucideIcon className="size-4 shrink-0 text-muted-foreground" name={icon} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{description}</span>
                </span>
                {badge > 0 && <Badge variant="brand">{badge}</Badge>}
                <LucideIcon className="size-4 shrink-0 text-muted-foreground" name="chevron-right" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
