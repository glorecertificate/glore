import { AuthFrame } from '@/components/features/auth/auth-frame'
import { ApplicationForm } from '@/components/features/organization/application/application-form'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Register',
  title: 'metaTitle',
})

const RegisterPage = () => (
  <AuthFrame size="md">
    <h1 className="sr-only">
      <PageTitle namespace="Register" name="metaTitle" />
    </h1>
    <ApplicationForm />
  </AuthFrame>
)

export default RegisterPage
