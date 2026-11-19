import 'server-only'

import { cache } from 'react'

import { type Locale } from 'next-intl'
import { getLocale } from 'next-intl/server'

import { loadPendingCounts } from '@/actions/admin/pending-core'
import { type DashboardBase, type DashboardData, resolveView } from '@/actions/dashboard/core'
import { loadEditorSummary } from '@/actions/dashboard/editor'
import { loadManagerSummary } from '@/actions/dashboard/manager'
import { loadLearnerSummary, loadVolunteerSummary } from '@/actions/dashboard/member'
import { readClock } from '@/actions/dashboard/now'
import { loadTutorSummary } from '@/actions/dashboard/tutor'
import { fetchNotificationPreview } from '@/actions/notifications/preview'
import { loadViewerInvitations } from '@/actions/shell/invitations-core'
import { getViewer, getViewerOrgId } from '@/actions/viewer'

export const loadDashboard = cache(async (): Promise<DashboardData> => {
  const [user, organizationId, locale] = await Promise.all([getViewer(), getViewerOrgId(), getLocale()])
  const organization = user.organizations.find(({ id }) => id === organizationId) ?? null
  const view = resolveView({ canEdit: user.canEdit, role: organization?.role ?? null })
  const base: DashboardBase = { firstName: user.firstName, organization: organization?.name ?? null }

  if (view === 'editor') {
    const [summary, pending] = await Promise.all([
      loadEditorSummary(locale as Locale),
      user.isAdmin ? loadPendingCounts() : null,
    ])
    return { ...base, editor: { ...summary, pending }, view }
  }

  if (view === 'manager') {
    const manager = await loadManagerSummary(await readClock())
    if (manager) return { ...base, manager, view }
    return { ...base, invitations: await loadViewerInvitations(), view: 'none' }
  }

  if (view === 'tutor') {
    const [tutor, notifications] = await Promise.all([
      loadTutorSummary(await readClock()),
      fetchNotificationPreview(user.id, 5),
    ])
    return { ...base, notifications: notifications.data?.items ?? [], tutor, view }
  }

  if (view === 'learner') {
    const member = await loadLearnerSummary({ language: locale as Locale, userId: user.id })
    return { ...base, member, view }
  }

  if (view === 'volunteer') {
    const volunteer = await loadVolunteerSummary({
      holder: {
        birthPlace: user.birthPlace,
        birthday: user.birthday,
        firstName: user.firstName,
        lastName: user.lastName,
        nationality: user.nationality,
      },
      language: locale as Locale,
      organizationId,
      userId: user.id,
    })
    return { ...base, view, volunteer }
  }

  return { ...base, invitations: await loadViewerInvitations(), view: 'none' }
})
