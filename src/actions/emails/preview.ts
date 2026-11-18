import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { getViewer } from '@/actions/viewer'
import { type EmailCategory } from '@/emails/translate'
import { CacheTag, messagesTag } from '@/lib/cache'
import { EMAIL_TEMPLATE_NAMES, type TemplateName, previewTemplate, renderEmail } from '@/lib/email'
import { DEFAULT_LOCALE } from '@/lib/i18n'

interface EmailPreviewOptions {
  category?: EmailCategory | null
  locale?: string
  template?: string | null
}

const renderPreview = async (name: TemplateName, category: EmailCategory | null, locale: string) => {
  'use cache'
  cacheTag(CacheTag.Settings, messagesTag(locale), messagesTag(DEFAULT_LOCALE))
  cacheLife({ stale: 60, revalidate: 900, expire: 86_400 })

  try {
    const { html, subject } = await renderEmail({ category, locale, template: previewTemplate(name) })
    return { html, subject }
  } catch (error) {
    console.error(`[emails] preview of ${name} failed`, error)
    return { html: null, subject: null }
  }
}

export const loadEmailPreview = async ({ category = null, locale, template }: EmailPreviewOptions) => {
  const user = await getViewer()
  if (!(user.isAdmin || user.canEdit)) return { data: null, error: 'Forbidden' }

  const name = EMAIL_TEMPLATE_NAMES.find(candidate => candidate === template) ?? EMAIL_TEMPLATE_NAMES[0]
  if (!name) return { data: null, error: 'No templates' }

  const { html, subject } = await renderPreview(name, category, locale ?? DEFAULT_LOCALE)
  return { data: { name, templates: EMAIL_TEMPLATE_NAMES, html, subject }, error: null }
}
