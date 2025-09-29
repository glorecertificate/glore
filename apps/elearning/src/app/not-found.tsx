import { Button } from '@repo/ui/components/button'

import { ErrorView } from '@/components/layout/error-view'
import { Link } from '@/components/ui/link'
import { createApi } from '@/lib/api/ssr'
import { getTranslations } from '@/lib/i18n'

export default async () => {
  const api = await createApi()
  const t = await getTranslations('Common')
  const user = await api.users.getCurrent()
  const message = user ? t('backToHome') : t('accessApp')

  return (
    <ErrorView className="min-h-screen" type="not-found">
      <Button asChild size="lg" variant="outline">
        <Link href="/">{message}</Link>
      </Button>
    </ErrorView>
  )
}
