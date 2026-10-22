import { parseAsInteger, parseAsStringEnum } from 'nuqs'

import { NOTIFICATION_CATEGORIES } from '@/db/queries/notification'

export const NOTIFICATION_FILTERS = ['all', 'unread'] as const

export const PAGE_SIZE = 20

export const notificationFilterParser = parseAsStringEnum([...NOTIFICATION_FILTERS]).withDefault('all')

export const notificationCategoryParser = parseAsStringEnum([...NOTIFICATION_CATEGORIES])

export const notificationLimitParser = parseAsInteger.withDefault(PAGE_SIZE)
