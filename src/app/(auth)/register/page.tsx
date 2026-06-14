import { RegisterForm } from '@/components/auth/register-form'
import { Logo } from '@/components/ui/logo'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Register',
  title: 'metaTitle',
})

const RegisterPage = () => (
  <div className="flex min-h-screen items-center justify-center p-6">
    <div className="mx-auto w-full max-w-xl space-y-12">
      <div className="flex flex-col items-center gap-8">
        <Logo className="w-40" />
      </div>
      <RegisterForm />
    </div>
  </div>
)

export default RegisterPage
