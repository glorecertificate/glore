import 'server-only'

import { getCurrentUser } from '@/actions/user'
import { type EmailCategory } from '@/emails/translate'
import { EMAIL_TEMPLATE_NAMES, previewTemplate, renderEmail } from '@/lib/email'

interface EmailPreviewOptions {
  category?: EmailCategory | null
  locale?: string
  template?: string | null
}

export const loadEmailPreview = async ({ category = null, locale, template }: EmailPreviewOptions) => {
  const user = await getCurrentUser()
  if (!(user.isAdmin || user.canEdit)) return { data: null, error: 'Forbidden' }

  const name = EMAIL_TEMPLATE_NAMES.find(candidate => candidate === template) ?? EMAIL_TEMPLATE_NAMES[0]
  if (!name) return { data: null, error: 'No templates' }

  const base = { name, templates: EMAIL_TEMPLATE_NAMES }
  try {
    const { html, subject } = await renderEmail({ category, locale, template: previewTemplate(name) })
    return { data: { ...base, html, subject }, error: null }
  } catch (error) {
    console.error(`[emails] preview of ${name} failed`, error)
    return { data: { ...base, html: null, subject: null }, error: null }
  }
}
