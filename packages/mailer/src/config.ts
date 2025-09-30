import metadata from '@config/metadata'
import theme from '@config/theme'
import { createFormatter, type Messages } from '@glore/i18n'

import { type AuthEmailOptions, type EmailOptions, type MailerOptions } from './types'

export const mailer = {
  templates: ['auth/recovery'] as const,
  smtp: {
    host: process.env.SMTP_HOST,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },
  appUrl: process.env.APP_URL,
  storageUrl: `${process.env.STORAGE_URL}/emails`,
  sender: process.env.EMAIL_SENDER,
  theme: {
    colors: {
      brand: theme.colors.light.brand,
      offwhite: '#f9fbfb',
      success: theme.colors.light.success,
      link: '#5ab9d2',
    },
    fontFamily: {
      sansSerif:
        'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    },
  } as const satisfies MailerOptions['tailwindConfig'],
  assets: {
    logo: 'logo.png',
  } as const,
  preview: {
    formatter: createFormatter('en') as (
      key: keyof Messages['Email'],
      vars?: Record<string, string | number>
    ) => string,
    common: {
      from: process.env.EMAIL_SENDER,
      to: 'john.doe@example.com',
      username: 'John Doe',
      t: {
        address: `${metadata.name} Inc., 123 Main St, Springfield, USA`,
        copyright: `© {year} ${metadata.name}. All rights reserved.`,
        outro: 'Thanks,',
        signature: `The ${metadata.shortName} Team`,
        app: metadata.name,
        contactUs: 'Contact Support',
        homepage: 'Homepage',
      },
    } satisfies EmailOptions & {
      t: Messages['Email']['common']
    },
    auth: {
      token: '123456',
      tokenHash: 'abcdef1234567890',
      tokenNew: '654321',
      tokenHashNew: '098765fedcba',
      redirectTo: process.env.APP_URL,
    } satisfies AuthEmailOptions,
  } as const,
}
