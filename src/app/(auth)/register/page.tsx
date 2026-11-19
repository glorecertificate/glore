import { AuthSplit } from '@/components/features/auth/auth-split'
import { ApplicationForm } from '@/components/features/organization/application/application-form'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Register',
  title: 'metaTitle',
})

const RegisterPage = () => (
  <AuthSplit
    message={<PageTitle namespace="Register" name="panelMessage" />}
    size="lg"
    title={<PageTitle namespace="Register" name="panelTitle" />}
  >
    <h1 className="sr-only">
      <PageTitle namespace="Register" name="metaTitle" />
    </h1>
    <ApplicationForm />
  </AuthSplit>
)

export default RegisterPage
