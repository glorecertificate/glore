import { getMessages } from 'next-intl/server'

import { ScopedMessagesProvider } from '@/components/providers/i18n'
import { pickMessages } from '@/lib/i18n'
import { MESSAGE_SCOPES, type MessageScope } from '@/lib/message-scopes'

export const MessagesScope = async ({ children, scope }: React.PropsWithChildren<{ scope: MessageScope }>) => {
  const messages = await getMessages()
  return (
    <ScopedMessagesProvider messages={pickMessages(messages, MESSAGE_SCOPES[scope])}>{children}</ScopedMessagesProvider>
  )
}
