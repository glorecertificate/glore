import 'server-only'

import { createElement } from 'react'

import { createTranslator } from 'next-intl'

import {
  type CertificateInput,
  type CertificatePdfData,
  type CertificatePdfLabels,
  type CertificatePdfSkill,
  certificateQr,
} from '@/components/features/certificates/certificate-layout'
import { CertificateDocument } from '@/components/features/certificates/document'
import { pdfImage, pdfLabels } from '@/components/features/certificates/pdf-helpers'
import { iconNodeOf } from '@/components/icons/registry'
import { SKILL_LEVELS } from '@/db/queries/skill-level-description'
import { loadMessages, resolveLocale } from '@/lib/messages'

export const certificatePdfLabels = async (language: string) => {
  const locale = resolveLocale(language)
  const messages = await loadMessages(locale)
  const t = createTranslator({ locale, messages, namespace: 'CertificatePdf' })
  const common = createTranslator({ locale, messages, namespace: 'Common' })
  return pdfLabels(
    key => t(key),
    SKILL_LEVELS.map(level => common(`skillLevels.${level}`))
  )
}

const pdfIconNodeOf = (icon: string | null) => (icon ? iconNodeOf(icon) : null) as CertificatePdfSkill['iconNode']

const qrOf = async (url: string | null) => (url ? await certificateQr(url) : { qrPath: null, qrSize: 0 })

const verifyUrlOf = (code: string | null) =>
  code ? `${(process.env.APP_URL ?? '').replace(/^https?:\/\//u, '')}/verify/${code}` : null

const render = async (data: CertificatePdfData, labels: CertificatePdfLabels) => {
  const { renderToBuffer } = await import('@react-pdf/renderer')
  return await renderToBuffer(
    createElement(CertificateDocument, { data, labels }) as Parameters<typeof renderToBuffer>[0]
  )
}

export const generateCertificatePdf = async (
  input: CertificateInput,
  language: string,
  frozenLabels?: CertificatePdfLabels
) => {
  const verifyUrl = verifyUrlOf(input.code)
  const [labels, qr] = await Promise.all([
    frozenLabels ?? certificatePdfLabels(language),
    qrOf(input.code ? `${process.env.APP_URL ?? ''}/verify/${input.code}` : null),
  ])
  const data: CertificatePdfData = {
    ...input,
    ...qr,
    organization: {
      ...input.organization,
      logoUrl: pdfImage(input.organization.logoUrl),
      signatureUrl: pdfImage(input.organization.signatureUrl),
    },
    skills: input.skills.map(({ icon, ...skill }) => ({ ...skill, iconNode: pdfIconNodeOf(icon) })),
    verifyUrl,
  }
  try {
    return await render(data, labels)
  } catch (error) {
    if (!(data.organization.logoUrl || data.organization.signatureUrl)) throw error
    console.error('[pdf] rendering with organization images failed, retrying without them', error)
    return await render({ ...data, organization: { ...data.organization, logoUrl: null, signatureUrl: null } }, labels)
  }
}
