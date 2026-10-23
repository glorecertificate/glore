import { describe, expect, it } from 'vitest'

import { notificationCategoriesFor } from '@/components/features/users/notification-categories'

describe('notificationCategoriesFor', () => {
  it('lists organization updates for organization admins and representatives', () => {
    expect(notificationCategoriesFor(['volunteer', 'admin'])).toEqual(['learning', 'organization', 'reminders'])
    expect(notificationCategoriesFor(['representative'])).toEqual(['learning', 'organization', 'reminders'])
  })

  it('hides organization updates for other members and users without memberships', () => {
    expect(notificationCategoriesFor(['volunteer', 'tutor', 'learner'])).toEqual(['learning', 'reminders'])
    expect(notificationCategoriesFor([])).toEqual(['learning', 'reminders'])
  })
})
