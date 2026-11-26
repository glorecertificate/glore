import { type Locale } from 'next-intl'
import { getMessages } from 'next-intl/server'

import { ScopedMessagesProvider } from '@/components/providers/i18n'
import { pickMessages } from '@/lib/i18n'
import { MESSAGE_SCOPES, type MessageScope } from '@/lib/message-scopes'

interface MessagesScopeProps {
  locale?: Locale
  scope: MessageScope
}

export const MessagesScope = async ({ children, locale, scope }: React.PropsWithChildren<MessagesScopeProps>) => {
  const messages = await getMessages(locale ? { locale } : undefined)
  return (
    <ScopedMessagesProvider messages={pickMessages(messages, MESSAGE_SCOPES[scope])}>{children}</ScopedMessagesProvider>
  )
}
