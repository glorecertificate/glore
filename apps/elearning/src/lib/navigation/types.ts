import { type AppRouteHandlerRoutes, type AppRoutes, type LayoutRoutes } from 'next/types/routes'

import { type Enum, type HTTPUrl, type MailToUrl, type MessageUrl, type TelUrl } from '@repo/utils/types'

import { type CourseListEditorView, type CourseListLearnerView } from './config'

/**
 * Valid application routes.
 */
export type Routes = AppRoutes | LayoutRoutes | AppRouteHandlerRoutes

/**
 * Valid external URLs used across the application.
 */
export type ExternalUrl = HTTPUrl | MailToUrl | MessageUrl | TelUrl

/**
 * Union type for all possible URLs.
 */
export type AnyUrl = Routes | ExternalUrl

/**
 * Union type for all possible course list views.
 */
export type CourseListView = Enum<CourseListEditorView | CourseListLearnerView>
