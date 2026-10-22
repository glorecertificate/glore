import { describe, expect, it } from 'vitest'

import { type NotifyPerson, planNotifications } from '@/actions/notifications/plan'

const person = (id: string, overrides: Partial<NotifyPerson> = {}): NotifyPerson => ({
  banned: false,
  email: `${id}@example.org`,
  firstName: id,
  id,
  locale: null,
  notificationPreferences: {},
  ...overrides,
})

const base = {
  actorId: null,
  category: 'mandatory' as const,
  emailTo: [],
  fallbackLocale: null,
  inApp: [],
  notifyActor: false,
  people: [],
}

describe('planNotifications', () => {
  it('dedupes in-app recipients and skips the actor, banned, and unknown users', () => {
    const plan = planNotifications({
      ...base,
      actorId: 'actor',
      inApp: ['tutor', 'tutor', 'actor', 'banned', 'ghost'],
      people: [person('tutor'), person('actor'), person('banned', { banned: true })],
    })

    expect(plan.inAppIds).toEqual(['tutor'])
  })

  it('keeps the actor when the event notifies the actor', () => {
    const plan = planNotifications({
      ...base,
      actorId: 'owner',
      emailTo: [{ userId: 'owner' }],
      inApp: ['owner'],
      notifyActor: true,
      people: [person('owner')],
    })

    expect(plan.inAppIds).toEqual(['owner'])
    expect(plan.mails.map(({ userId }) => userId)).toEqual(['owner'])
  })

  it('drops optional mail for users who turned the category off and keeps their in-app row', () => {
    const plan = planNotifications({
      ...base,
      category: 'reminders',
      emailTo: [{ userId: 'muted' }, { userId: 'default' }],
      inApp: ['muted', 'default'],
      people: [person('muted', { notificationPreferences: { reminders: false } }), person('default')],
    })

    expect(plan.inAppIds).toEqual(['muted', 'default'])
    expect(plan.mails.map(({ userId }) => userId)).toEqual(['default'])
  })

  it('always sends mandatory mail, even to muted and banned users', () => {
    const plan = planNotifications({
      ...base,
      emailTo: [{ userId: 'muted' }, { userId: 'banned' }],
      people: [
        person('muted', { notificationPreferences: { learning: false, organization: false, reminders: false } }),
        person('banned', { banned: true }),
      ],
    })

    expect(plan.mails.map(({ userId }) => userId)).toEqual(['muted', 'banned'])
  })

  it('skips optional mail to banned users', () => {
    const plan = planNotifications({
      ...base,
      category: 'learning',
      emailTo: [{ userId: 'banned' }],
      people: [person('banned', { banned: true })],
    })

    expect(plan.mails).toEqual([])
  })

  it('uses the user locale, then the event locale, then the default', () => {
    const plan = planNotifications({
      ...base,
      emailTo: [{ userId: 'it' }, { userId: 'none' }, { email: 'guest@example.org', locale: null, name: null }],
      fallbackLocale: 'es',
      people: [person('it', { locale: 'it' }), person('none')],
    })

    expect(plan.mails.map(({ locale }) => locale)).toEqual(['it', 'es', 'es'])
    expect(
      planNotifications({ ...base, emailTo: [{ userId: 'none' }], people: [person('none')] }).mails[0]?.locale
    ).toBe('en')
  })

  it('mails addresses without an account and dedupes them case-insensitively', () => {
    const plan = planNotifications({
      ...base,
      emailTo: [
        { email: 'Guest@Example.org', locale: 'it', name: 'Guest' },
        { email: 'guest@example.org', locale: null, name: null },
        { userId: 'guest' },
      ],
      people: [person('guest')],
    })

    expect(plan.mails).toEqual([{ email: 'Guest@Example.org', locale: 'it', name: 'Guest', userId: null }])
  })

  it('plans no mail when the event has no email channel', () => {
    const plan = planNotifications({ ...base, category: null, emailTo: [{ userId: 'a' }], people: [person('a')] })

    expect(plan.mails).toEqual([])
  })
})
