import 'server-only'

import { type Locale } from 'next-intl'
import { getLocale } from 'next-intl/server'

import { getPendingCounts } from '@/actions/admin/pending'
import { type DashboardBase, type DashboardData, resolveView } from '@/actions/dashboard/core'
import { loadEditorSummary } from '@/actions/dashboard/editor'
import { loadManagerSummary } from '@/actions/dashboard/manager'
import { loadMemberSummary } from '@/actions/dashboard/member'
import { loadTutorSummary } from '@/actions/dashboard/tutor'
import { listNotifications } from '@/actions/notifications/inbox'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'

export const loadDashboard = async (): Promise<DashboardData> => {
  const [user, organizationId, locale] = await Promise.all([getCurrentUser(), getActiveOrgId(), getLocale()])
  const organization = user.organizations.find(({ id }) => id === organizationId) ?? null
  const view = resolveView({ canEdit: user.canEdit, role: organization?.role ?? null })
  const base: DashboardBase = { firstName: user.firstName, organization: organization?.name ?? null }
  const now = Date.now()

  if (view === 'editor') {
    const [summary, pending] = await Promise.all([
      loadEditorSummary(locale as Locale),
      user.isAdmin ? getPendingCounts() : null,
    ])
    return { ...base, editor: { ...summary, pending }, view }
  }

  if (view === 'manager') {
    const manager = await loadManagerSummary(now)
    return manager ? { ...base, manager, view } : { ...base, view: 'none' }
  }

  if (view === 'tutor') {
    const [tutor, notifications] = await Promise.all([loadTutorSummary(now), listNotifications({ limit: 5 })])
    return { ...base, notifications: notifications.data?.items ?? [], tutor, view }
  }

  if (view === 'volunteer' || view === 'learner') {
    const member = await loadMemberSummary({
      language: locale as Locale,
      organizationId,
      role: view,
      userId: user.id,
    })
    return { ...base, member, view }
  }

  return { ...base, view: 'none' }
}
