import { createContext } from 'react'

export type EmailCategory = 'learning' | 'mandatory' | 'organization' | 'reminders'

export interface EmailContextValue {
  category: EmailCategory | null
}

export const EmailContext = createContext<EmailContextValue>({ category: null })
