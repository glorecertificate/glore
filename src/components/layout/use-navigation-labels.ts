'use client'

import { useTranslations } from 'next-intl'

import { type NavigationId } from '@/components/layout/navigation'

export const useNavigationLabels = () => {
  const t = useTranslations('Search')
  const tLayout = useTranslations('Layout')
  const tUsers = useTranslations('Users')
  const tOrganization = useTranslations('Organization')
  const tInvitations = useTranslations('Invitations')
  const tEmails = useTranslations('AdminEmails')
  const tAdmin = useTranslations('Admin')
  const tLegal = useTranslations('LegalAdmin')
  const tTranslations = useTranslations('Translations')

  return {
    about: tLayout('about'),
    'admin-audit': tAdmin('audit.title'),
    'admin-certificates': tAdmin('certificates.title'),
    'admin-emails': tEmails('title'),
    'admin-legal': tLegal('title'),
    'admin-organizations': tLayout('adminOrganizations'),
    'admin-overview': tAdmin('overview.title'),
    'admin-team': tLayout('adminTeam'),
    'admin-translations': tTranslations('title'),
    'admin-users': tLayout('adminUsers'),
    certificates: tLayout('certificates'),
    courses: tLayout('courses'),
    dashboard: tLayout('dashboard'),
    docs: tLayout('docs'),
    help: tLayout('help'),
    'invite-members': t('inviteMembers'),
    notifications: tLayout('notifications'),
    organization: tLayout('organization'),
    'organization-activity': tOrganization('activity'),
    'organization-certificates': tOrganization('certificates'),
    'organization-insights': tOrganization('insights'),
    'organization-invitations': tInvitations('tab'),
    'organization-members': tOrganization('members'),
    'organization-overview': tOrganization('overview'),
    'organization-requests': tOrganization('joinRequests'),
    'organization-settings': tOrganization('settings'),
    'register-organization': tLayout('registerOrganization'),
    'request-certificate': t('requestCertificate'),
    settings: tLayout('settings'),
    'settings-account': tUsers('account'),
    'settings-data': tUsers('data'),
    'settings-notifications': tUsers('notifications'),
    'settings-privacy': tUsers('privacy'),
    'settings-profile': tUsers('profile'),
    'settings-security': tUsers('security'),
    'skills-framework': t('skillsFramework'),
  } satisfies Record<NavigationId, string>
}
