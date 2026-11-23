import { describe, expect, it } from 'vitest'

import { notificationCategoriesFor } from '@/components/features/users/notification-categories'

describe('notificationCategoriesFor', () => {
  it('lists organization updates for organization admins and representatives', () => {
    expect(notificationCategoriesFor({ certificates: true, roles: ['volunteer', 'admin'] })).toEqual([
      'learning',
      'organization',
      'reminders',
    ])
    expect(notificationCategoriesFor({ certificates: false, roles: ['representative'] })).toEqual([
      'organization',
      'reminders',
    ])
  })

  it('hides organization updates for other members and users without memberships', () => {
    expect(notificationCategoriesFor({ certificates: true, roles: ['volunteer', 'tutor', 'learner'] })).toEqual([
      'learning',
      'reminders',
    ])
    expect(notificationCategoriesFor({ certificates: false, roles: [] })).toEqual(['reminders'])
  })

  it('lists learning progress only for users who can hold certificates', () => {
    expect(notificationCategoriesFor({ certificates: false, roles: ['tutor'] })).toEqual(['reminders'])
    expect(notificationCategoriesFor({ certificates: true, roles: ['volunteer'] })).toEqual(['learning', 'reminders'])
  })
})
