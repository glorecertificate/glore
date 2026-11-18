import { BrandShell } from '@/components/features/auth/brand-shell'
import { ApplicationForm } from '@/components/features/organization/application/application-form'
import { PageTitle } from '@/components/layout/page-title'
import { Card } from '@/components/ui/card'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Register',
  title: 'metaTitle',
})

const RegisterPage = () => (
  <BrandShell size="xs">
    <Card className="gap-6 p-5 sm:p-8">
      <h1 className="sr-only">
        <PageTitle namespace="Register" name="metaTitle" />
      </h1>
      <ApplicationForm />
    </Card>
  </BrandShell>
)

export default RegisterPage
