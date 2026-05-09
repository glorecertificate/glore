import * as webpush from 'web-push'

interface PushPayload {
  body: string
  title: string
  url?: string
}

interface PushSubscriptionData {
  endpoint: string
  keys: {
    auth: string
    p256dh: string
  }
}

const initWebPush = () => {
  const { VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_SUBJECT } = process.env
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false
  webpush.setVapidDetails(VAPID_SUBJECT ?? 'mailto:hello@glorecertificate.net', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  return true
}

export const sendPushNotification = async (subscription: PushSubscriptionData, payload: PushPayload) => {
  if (!initWebPush()) return
  await webpush.sendNotification(subscription, JSON.stringify(payload)).catch(() => null)
}
