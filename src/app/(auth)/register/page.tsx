import { AuthMain } from '@/components/features/auth/auth-frame'
import { ApplicationProvider } from '@/components/features/organization/application/application-context'
import { ApplicationForm } from '@/components/features/organization/application/application-form'
import { ApplicationSteps } from '@/components/features/organization/application/application-steps'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Register',
  title: 'metaTitle',
})

const RegisterPage = () => (
  <ApplicationProvider>
    <AuthMain header={<ApplicationSteps />} size="lg">
      <h1 className="sr-only">
        <PageTitle namespace="Register" name="metaTitle" />
      </h1>
      <ApplicationForm />
    </AuthMain>
  </ApplicationProvider>
)

export default RegisterPage
