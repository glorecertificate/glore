import { ErrorView } from '@/components/layout/error-view'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { getTranslations } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/ssr'

export default async () => {
  const t = await getTranslations('Common')
  const user = await getCurrentUser()
  const message = user ? t('backToHome') : t('accessApp')

  return (
    <ErrorView className="min-h-screen" type="not-found">
      <Button asChild size="lg" variant="outline">
        <Link href="/">{message}</Link>
      </Button>
    </ErrorView>
  )
}
