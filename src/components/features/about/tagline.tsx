import { getTranslations } from 'next-intl/server'

export const AboutTagline = async () => {
  const t = await getTranslations('About')
  return t('intro.tagline')
}
