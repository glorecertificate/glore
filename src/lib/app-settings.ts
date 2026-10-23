import { z } from 'zod'

import metadata from '~/config/metadata.json'

export const SETTING_KEYS = ['email', 'phone', 'website', 'social', 'legalEntity'] as const

type SettingKey = (typeof SETTING_KEYS)[number]

export const SOCIAL_PLATFORMS = ['facebook', 'instagram', 'linkedin', 'x', 'youtube'] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]

export const SOCIAL_LABELS = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  x: 'X',
  youtube: 'YouTube',
} as const satisfies Record<SocialPlatform, string>

export interface SettingsMessages {
  email: string
  phone: string
  required: string
  url: string
}

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/u

const COUNTRY_REGEX = /^[a-z]{2}$/u

const DEFAULT_MESSAGES: SettingsMessages = {
  email: 'Enter a valid email address',
  phone: 'Enter a phone number with the country code',
  required: 'This field is required',
  url: 'Enter a valid web address starting with http or https',
}

const createSettingSchemas = (messages: SettingsMessages) => {
  const text = (max: number) => z.string().trim().min(1, messages.required).max(max, messages.required)
  const httpUrl = z
    .string()
    .trim()
    .max(300, messages.url)
    .pipe(z.url({ error: messages.url, protocol: /^https?$/u }))
  const optionalUrl = z
    .string()
    .trim()
    .max(300, messages.url)
    .refine(value => value === '' || httpUrl.safeParse(value).success, messages.url)

  return {
    email: z.string().trim().toLowerCase().max(254, messages.email).pipe(z.email(messages.email)),
    legalEntity: z.object({
      address: text(240),
      country: z.string().trim().toLowerCase().regex(COUNTRY_REGEX, messages.required),
      name: text(120),
    }),
    phone: z.string().trim().regex(PHONE_REGEX, messages.phone),
    social: z.object({
      facebook: optionalUrl,
      instagram: optionalUrl,
      linkedin: optionalUrl,
      x: optionalUrl,
      youtube: optionalUrl,
    } satisfies Record<SocialPlatform, typeof optionalUrl>),
    website: httpUrl,
  } satisfies Record<SettingKey, z.ZodType>
}

export const createSettingsSchema = (messages: SettingsMessages = DEFAULT_MESSAGES) =>
  z.object(createSettingSchemas(messages))

const settingSchemas = createSettingSchemas(DEFAULT_MESSAGES)

export const settingsInputSchema = createSettingsSchema()

export type AppSettings = z.output<typeof settingsInputSchema>

export type AppSettingsInput = z.input<typeof settingsInputSchema>

export const DEFAULT_SETTINGS: AppSettings = settingsInputSchema.parse({
  email: metadata.email,
  legalEntity: metadata.legalEntity,
  phone: metadata.phone,
  social: metadata.social,
  website: metadata.website,
})

export interface SettingRow {
  key: string
  value: unknown
}

const isSettingKey = (key: string): key is SettingKey => (SETTING_KEYS as readonly string[]).includes(key)

export const parseSettings = (rows: SettingRow[]): AppSettings => {
  const settings: AppSettings = { ...DEFAULT_SETTINGS }
  for (const { key, value } of rows) {
    if (!isSettingKey(key)) continue
    const result = settingSchemas[key].safeParse(value)
    if (result.success) Object.assign(settings, { [key]: result.data })
  }
  return settings
}

export const changedSettings = (current: AppSettings, next: AppSettings) =>
  SETTING_KEYS.filter(key => JSON.stringify(current[key]) !== JSON.stringify(next[key]))

export const socialLinks = ({ social }: Pick<AppSettings, 'social'>) =>
  SOCIAL_PLATFORMS.flatMap(platform => (social[platform] ? [{ href: social[platform], platform }] : []))
