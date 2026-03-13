import { RegisterForm } from '@/components/features/auth/register-form'
import { GloreIcon } from '@/components/icons/glore'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Register',
    title: 'metaTitle',
  })

export default () => (
  <div className="flex min-h-screen items-center justify-center p-6">
    <div className="mx-auto w-full max-w-xl space-y-8">
      <div className="flex flex-col items-center gap-8">
        <GloreIcon className="w-40" />
      </div>
      <RegisterForm />
    </div>
  </div>
)
