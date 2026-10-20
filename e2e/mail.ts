import { type APIRequestContext, expect } from '@playwright/test'

const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://localhost:8025'

interface MailpitSearch {
  messages: { ID: string }[]
}

interface MailpitMessage {
  Text: string
}

const searchParams = (to: string) => ({ params: { query: `to:"${to}"` } })

export const isMailpitUp = async (request: APIRequestContext) => {
  try {
    return (await request.get(`${MAILPIT_URL}/api/v1/info`)).ok()
  } catch {
    return false
  }
}

export const clearMail = async (request: APIRequestContext, to: string) => {
  await request.delete(`${MAILPIT_URL}/api/v1/search`, searchParams(to))
}

const latestMessageId = async (request: APIRequestContext, to: string) => {
  const response = await request.get(`${MAILPIT_URL}/api/v1/search`, searchParams(to))
  const { messages } = (await response.json()) as MailpitSearch
  return messages[0]?.ID ?? ''
}

export const latestMailText = async (request: APIRequestContext, to: string) => {
  await expect
    .poll(() => latestMessageId(request, to), {
      message: `No email to ${to} reached Mailpit: run the app with MAIL_TRANSPORT=mailpit`,
      timeout: 15_000,
    })
    .not.toBe('')
  const response = await request.get(`${MAILPIT_URL}/api/v1/message/${await latestMessageId(request, to)}`)
  const { Text } = (await response.json()) as MailpitMessage
  return Text
}

export const mailLinkPath = (text: string, marker: string) => {
  const link = text.match(new RegExp(`https?://\\S*${marker}\\S*`, 'u'))?.[0]
  if (!link) throw new Error(`No ${marker} link in the email`)
  const url = new URL(link)
  return `${url.pathname}${url.search}`
}
