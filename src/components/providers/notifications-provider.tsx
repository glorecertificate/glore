import { listNotifications } from '@/actions/notification'
import { NotificationsContextProvider } from '@/components/providers/notifications-context'

export const NotificationsProvider = async ({ children }: React.PropsWithChildren) => {
  const { data } = await listNotifications()
  const value = { notifications: data ?? [] }
  return <NotificationsContextProvider value={value}>{children}</NotificationsContextProvider>
}
