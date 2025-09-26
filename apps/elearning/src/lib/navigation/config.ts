import metadata from '@config/metadata'

import { type Routes } from './types'

export const authRoutes = ['/login', '/api/auth/verify'] as const satisfies Routes[]

export const externalRoutes = {
  app: metadata.url,
  www: metadata.website,
  maps: 'https://maps.google.com',
  gmail: 'https://mail.google.com',
  outlook: 'https://outlook.office.com/mail',
  appleMail: 'message://',
} as const

export enum AuthView {
  Login = 'login',
  PasswordRequest = 'password_request',
  EmailSent = 'email_sent',
  PasswordReset = 'password_reset',
  PasswordUpdated = 'password_updated',
  InvalidToken = 'invalid_token',
  InvalidPasswordReset = 'invalid_password_reset',
}

export enum CourseListEditorView {
  All = 'all',
  Published = 'published',
  Partial = 'partial',
  Draft = 'draft',
  Archived = 'archived',
}

export enum CourseListLearnerView {
  All = 'all',
  NotStarted = 'not_started',
  InProgress = 'in_progress',
  Completed = 'completed',
}
