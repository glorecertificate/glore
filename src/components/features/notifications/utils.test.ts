import { describe, expect, it, vi } from 'vitest'

import {
  groupByDay,
  messageKey,
  messageValues,
  messageVariant,
  roleGroup,
} from '@/components/features/notifications/utils'
import { notificationCategory, notificationHref } from '@/db/queries/notification'
import en from '~/messages/en.json'
import es from '~/messages/es.json'
import it_ from '~/messages/it.json'

vi.mock('@/db/client', () => ({ db: {} }))

const at = (offsetDays: number, hour: number, now: Date) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays, hour).toISOString()

describe('groupByDay', () => {
  const now = new Date(2026, 9, 22, 15)

  it('groups items by local day and labels today and yesterday', () => {
    const items = [
      { createdAt: at(0, 14, now), id: 1 },
      { createdAt: at(0, 9, now), id: 2 },
      { createdAt: at(-1, 22, now), id: 3 },
      { createdAt: at(-5, 8, now), id: 4 },
    ]
    const groups = groupByDay(items, now)

    expect(groups.map(group => group.kind)).toEqual(['today', 'yesterday', 'earlier'])
    expect(groups.map(group => group.items.map(({ id }) => id))).toEqual([[1, 2], [3], [4]])
  })

  it('returns no groups for an empty list', () => {
    expect(groupByDay([], now)).toEqual([])
  })
})

describe('message helpers', () => {
  it('turns event types into message keys', () => {
    expect(messageKey('join_request.decided')).toBe('join_request_decided')
  })

  it('picks a variant for decisions and team roles', () => {
    expect(messageVariant('join_request.decided', { accepted: true })).toBe('accepted')
    expect(messageVariant('join_request.decided', { accepted: false })).toBe('rejected')
    expect(messageVariant('team.role_changed', { role: null })).toBe('removed')
    expect(messageVariant('team.role_changed', { role: 'editor' })).toBe('set')
    expect(messageVariant('organization.ownership_transferred', { variant: 'gained' })).toBe('gained')
    expect(messageVariant('organization.ownership_transferred', { variant: 'left' })).toBe('left')
    expect(messageVariant('organization.ownership_transferred', {})).toBeNull()
    expect(messageVariant('certificate.approved', {})).toBeNull()
  })

  it('labels team roles apart from organization roles', () => {
    expect(roleGroup('team.role_changed')).toBe('teamRoles')
    expect(roleGroup('team.invited')).toBe('teamRoles')
    expect(roleGroup('member.role_changed')).toBe('roles')
    expect(roleGroup('invitation.sent')).toBe('roles')
  })

  it('names the admin role per audience in every locale', () => {
    const admin = (messages: typeof en) => [messages.Notifications.roles.admin, messages.Notifications.teamRoles.admin]
    expect(admin(en)).toEqual(['Owner', 'Admin'])
    expect(admin(es)).toEqual(['Administrador/a', 'Admin'])
    expect(admin(it_)).toEqual(['Amministratore', 'Admin'])
  })

  it('always supplies every message value', () => {
    expect(messageValues({})).toEqual({ days: 0, name: '', organizationName: '', role: '' })
    expect(messageValues({ applicantName: 'Ada', days: 3 })).toMatchObject({ days: 3, name: 'Ada' })
  })
})

describe('notification parsing', () => {
  it('maps event types to categories', () => {
    expect(notificationCategory('certificate.approved')).toBe('certificates')
    expect(notificationCategory('invite_link.created')).toBe('organization')
    expect(notificationCategory('team.invited')).toBe('account')
    expect(notificationCategory('course.completed')).toBe('learning')
    expect(notificationCategory('unknown.thing')).toBeNull()
  })

  it('keeps only same-site deep links', () => {
    expect(notificationHref('/certificates/4')).toBe('/certificates/4')
    expect(notificationHref('https://evil.example')).toBeNull()
    expect(notificationHref('//evil.example')).toBeNull()
    expect(notificationHref(null)).toBeNull()
  })
})

describe('notification catalog coverage', () => {
  const catalogs = { en, es, it: it_ }

  it('has a message for every in-app event in every locale', async () => {
    const { EVENT_DEFINITIONS } = await import('@/actions/notifications/catalog')
    const variants: Record<string, string[]> = {
      'join_request.decided': ['accepted', 'rejected'],
      'organization.ownership_transferred': ['gained', 'left'],
      'team.role_changed': ['set', 'removed'],
    }
    const keys = Object.entries(EVENT_DEFINITIONS).flatMap(([type, definition]) => {
      if (!definition.inApp) return []
      const base = messageKey(type)
      return variants[type]?.map(variant => `${base}_${variant}`) ?? [base]
    })

    expect(keys.length).toBeGreaterThan(20)
    for (const [locale, messages] of Object.entries(catalogs)) {
      const events = messages.Notifications.events as Record<string, { body?: string; title: string }>
      for (const key of keys) {
        expect(events[key]?.title, `${locale}: ${key}`).toBeTruthy()
      }
    }
  })
})
