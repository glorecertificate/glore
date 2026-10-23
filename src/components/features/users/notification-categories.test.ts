import { describe, expect, it } from 'vitest'

import { notificationCategoriesFor } from '@/components/features/users/notification-categories'

describe('notificationCategoriesFor', () => {
  it('lists every category for members of an organization', () => {
    expect(notificationCategoriesFor(true)).toEqual(['learning', 'organization', 'reminders'])
  })

  it('hides organization updates without memberships', () => {
    expect(notificationCategoriesFor(false)).toEqual(['learning', 'reminders'])
  })
})
