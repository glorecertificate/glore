import metadata from '@config/metadata'
import theme from '@config/theme'

import { createFormatter } from '@glore/mailer/utils'

export const mailerConfig = {
  templates: ['auth/recovery'],
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
  },
  assets: {
    logo: 'logo.png',
  },
  preview: {
    formatter: createFormatter('en'),
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
    },
    auth: {
      token: '123456',
      token_hash: 'abcdef1234567890',
      token_new: '654321',
      token_hash_new: '098765fedcba',
      redirect_to: process.env.APP_URL,
    },
  },
} as const
