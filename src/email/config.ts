import metadata from '~/config/metadata.json'
import theme from '~/config/theme.json'

export const mailer = {
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    ssl: true,
    tls: false,
  },
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
  preview: {
    from: process.env.SMTP_SENDER,
    to: 'john.doe@example.com',
    username: 'John Doe',
    locale: 'it',
    token: '123456',
    tokenHash: 'abcdef1234567890',
    tokenNew: '654321',
    tokenHashNew: '098765fedcba',
    redirectTo: process.env.APP_URL ?? metadata.url,
  },
}
