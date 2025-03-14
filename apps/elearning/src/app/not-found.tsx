import { getTranslations } from 'next-intl/server'

import { Button } from '@/components/ui/button'

export default async () => {
  const t = await getTranslations('Common')

  return (
    <div>
      <h2>{t('notFound')}</h2>
      <p>{t('notFoundMessage')}</p>
      <Button>{t('notFoundAction')}</Button>
    </div>
  )
}
