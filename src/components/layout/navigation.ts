import { type Route } from 'next'

import { type OrganizationMembershipRole } from '@/db/queries/organization'
import { type IconName } from '@/lib/types'

export interface NavigationViewer {
  canEdit: boolean
  isAdmin: boolean
  role: OrganizationMembershipRole | null
}

export type NavigationGroup = 'actions' | 'admin' | 'organization' | 'pages' | 'settings'

export type NavigationId =
  | 'admin-organizations'
  | 'admin-team'
  | 'admin-users'
  | 'about'
  | 'certificates'
  | 'courses'
  | 'dashboard'
  | 'docs'
  | 'help'
  | 'invite-members'
  | 'notifications'
  | 'organization'
  | 'organization-activity'
  | 'organization-certificates'
  | 'organization-insights'
  | 'organization-invitations'
  | 'organization-members'
  | 'organization-overview'
  | 'organization-requests'
  | 'organization-settings'
  | 'register-organization'
  | 'request-certificate'
  | 'settings'
  | 'settings-account'
  | 'settings-data'
  | 'settings-notifications'
  | 'settings-privacy'
  | 'settings-profile'
  | 'settings-security'
  | 'skills-framework'

interface NavigationEntry {
  group: NavigationGroup
  href: Route
  icon: IconName
  id: NavigationId
  sidebar?: boolean
  visible: (viewer: NavigationViewer) => boolean
}

const everyone = () => true
const orgMember = ({ canEdit }: NavigationViewer) => !canEdit
const isManager = ({ canEdit, role }: NavigationViewer) => !canEdit && (role === 'admin' || role === 'representative')
const isOwner = ({ canEdit, role }: NavigationViewer) => !canEdit && role === 'admin'
const isVolunteer = ({ canEdit, role }: NavigationViewer) => !canEdit && role === 'volunteer'
const isAdmin = ({ isAdmin: admin }: NavigationViewer) => admin

const NAVIGATION: NavigationEntry[] = [
  { group: 'pages', href: '/dashboard', icon: 'layout-dashboard', id: 'dashboard', sidebar: true, visible: everyone },
  {
    group: 'pages',
    href: '/organization' as Route,
    icon: 'building-2',
    id: 'organization',
    sidebar: true,
    visible: isManager,
  },
  { group: 'pages', href: '/courses', icon: 'book-open', id: 'courses', sidebar: true, visible: everyone },
  {
    group: 'pages',
    href: '/certificates',
    icon: 'award',
    id: 'certificates',
    sidebar: true,
    visible: ({ canEdit, role }) => !canEdit && role !== 'learner',
  },
  { group: 'pages', href: '/docs', icon: 'book-marked', id: 'docs', sidebar: true, visible: everyone },
  { group: 'pages', href: '/notifications' as Route, icon: 'bell', id: 'notifications', visible: everyone },
  { group: 'pages', href: '/help', icon: 'circle-help', id: 'help', visible: everyone },
  { group: 'pages', href: '/about', icon: 'info', id: 'about', visible: everyone },
  { group: 'settings', href: '/settings', icon: 'settings', id: 'settings', visible: everyone },
  {
    group: 'settings',
    href: '/settings?tab=profile' as Route,
    icon: 'user-round',
    id: 'settings-profile',
    visible: everyone,
  },
  {
    group: 'settings',
    href: '/settings?tab=account' as Route,
    icon: 'at-sign',
    id: 'settings-account',
    visible: everyone,
  },
  {
    group: 'settings',
    href: '/settings?tab=privacy' as Route,
    icon: 'eye-off',
    id: 'settings-privacy',
    visible: everyone,
  },
  {
    group: 'settings',
    href: '/settings?tab=notifications' as Route,
    icon: 'bell-ring',
    id: 'settings-notifications',
    visible: everyone,
  },
  {
    group: 'settings',
    href: '/settings?tab=security' as Route,
    icon: 'shield-check',
    id: 'settings-security',
    visible: everyone,
  },
  {
    group: 'settings',
    href: '/settings?tab=data' as Route,
    icon: 'download',
    id: 'settings-data',
    visible: everyone,
  },
  {
    group: 'organization',
    href: '/organization?tab=overview' as Route,
    icon: 'layout-grid',
    id: 'organization-overview',
    visible: isManager,
  },
  {
    group: 'organization',
    href: '/organization?tab=members' as Route,
    icon: 'users',
    id: 'organization-members',
    visible: isManager,
  },
  {
    group: 'organization',
    href: '/organization?tab=invitations' as Route,
    icon: 'mail-plus',
    id: 'organization-invitations',
    visible: isManager,
  },
  {
    group: 'organization',
    href: '/organization?tab=requests' as Route,
    icon: 'user-round-plus',
    id: 'organization-requests',
    visible: isManager,
  },
  {
    group: 'organization',
    href: '/organization?tab=certificates' as Route,
    icon: 'award',
    id: 'organization-certificates',
    visible: isManager,
  },
  {
    group: 'organization',
    href: '/organization?tab=insights' as Route,
    icon: 'chart-no-axes-combined',
    id: 'organization-insights',
    visible: isManager,
  },
  {
    group: 'organization',
    href: '/organization?tab=activity' as Route,
    icon: 'activity',
    id: 'organization-activity',
    visible: isManager,
  },
  {
    group: 'organization',
    href: '/organization?tab=settings' as Route,
    icon: 'settings',
    id: 'organization-settings',
    visible: isOwner,
  },
  { group: 'admin', href: '/admin/team', icon: 'shield-user', id: 'admin-team', visible: isAdmin },
  { group: 'admin', href: '/admin/organizations', icon: 'building-2', id: 'admin-organizations', visible: isAdmin },
  { group: 'admin', href: '/admin/users' as Route, icon: 'users', id: 'admin-users', visible: isAdmin },
  {
    group: 'actions',
    href: '/certificates/new',
    icon: 'file-plus-2',
    id: 'request-certificate',
    visible: isVolunteer,
  },
  {
    group: 'actions',
    href: '/organization?tab=invitations' as Route,
    icon: 'user-plus',
    id: 'invite-members',
    visible: isManager,
  },
  { group: 'actions', href: '/register', icon: 'building', id: 'register-organization', visible: orgMember },
  {
    group: 'actions',
    href: '/courses/skills' as Route,
    icon: 'compass',
    id: 'skills-framework',
    visible: ({ canEdit }) => canEdit,
  },
]

export const entriesFor = (viewer: NavigationViewer, group?: NavigationGroup) =>
  NAVIGATION.filter(entry => (group ? entry.group === group : true) && entry.visible(viewer))

export const sidebarEntriesFor = (viewer: NavigationViewer) =>
  NAVIGATION.filter(entry => entry.sidebar && entry.visible(viewer))

export const showsOrganizationSwitcher = ({ canEdit }: Pick<NavigationViewer, 'canEdit'>) => !canEdit

export const matchesEntry = (label: string, query: string) => {
  const terms = query.toLowerCase().split(/\s+/u).filter(Boolean)
  const haystack = label.toLowerCase()
  return terms.every(term => haystack.includes(term))
}
