import 'server-only'

import { createElement } from 'react'

import { createTranslator } from 'next-intl'

import {
  CertificateDocument,
  type CertificatePdfData,
  type CertificatePdfLabels,
  type CertificatePdfSkill,
} from '@/components/features/certificates/document'
import { pdfImage, pdfLabels } from '@/components/features/certificates/pdf-helpers'
import { iconNodeOf } from '@/components/icons/registry'
import { SKILL_LEVELS } from '@/lib/constants'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n'

type Locale = (typeof LOCALES)[number]

type PdfInput = Omit<CertificatePdfData, 'qrPath' | 'qrSize' | 'skills' | 'verifyUrl'> & {
  skills: (Omit<CertificatePdfSkill, 'iconNode'> & { icon: string | null })[]
}

const toLocale = (language: string) => (LOCALES.includes(language as Locale) ? (language as Locale) : DEFAULT_LOCALE)

export const certificatePdfLabels = async (language: string) => {
  const locale = toLocale(language)
  const { default: messages } = await import(`~/messages/${locale}.json`)
  const t = createTranslator({ locale, messages, namespace: 'CertificatePdf' })
  const common = createTranslator({ locale, messages, namespace: 'Common' })
  return pdfLabels(
    key => t(key),
    SKILL_LEVELS.map(level => common(`skillLevels.${level}`))
  )
}

const pdfIconNodeOf = (icon: string | null) => (icon ? iconNodeOf(icon) : null) as CertificatePdfSkill['iconNode']

const qrOf = async (url: string | null) => {
  if (!url) return { qrPath: null, qrSize: 0 }
  const { create } = await import('qrcode')
  const { modules } = create(url, { errorCorrectionLevel: 'M' })
  const segments: string[] = []
  for (let row = 0; row < modules.size; row++) {
    for (let column = 0; column < modules.size; column++) {
      if (modules.get(row, column)) segments.push(`M${column} ${row}h1v1h-1z`)
    }
  }
  return { qrPath: segments.join(''), qrSize: modules.size }
}

const verifyUrlOf = (code: string | null) =>
  code ? `${(process.env.APP_URL ?? '').replace(/^https?:\/\//u, '')}/verify/${code}` : null

const render = async (data: CertificatePdfData, labels: CertificatePdfLabels) => {
  const { renderToBuffer } = await import('@react-pdf/renderer')
  return await renderToBuffer(
    createElement(CertificateDocument, { data, labels }) as Parameters<typeof renderToBuffer>[0]
  )
}

export const generateCertificatePdf = async (input: PdfInput, language: string) => {
  const verifyUrl = verifyUrlOf(input.code)
  const [labels, qr] = await Promise.all([
    certificatePdfLabels(language),
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
