import 'server-only'

import { createTransport } from 'nodemailer'

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export const sendMail = async ({ to, subject, html, text }: EmailOptions) =>
  await transporter.sendMail({
    from: process.env.SMTP_SENDER,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    text,
  })
