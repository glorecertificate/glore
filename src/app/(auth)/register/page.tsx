import Link from 'next/link'

import { ApplicationForm } from '@/components/features/organization/application/application-form'
import { PageTitle } from '@/components/layout/page-title'
import { Logo } from '@/components/ui/logo'
import { APP_ROOT } from '@/lib/constants'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Register',
  title: 'metaTitle',
})

const RegisterPage = () => (
  <main className="flex min-h-svh justify-center px-4 py-12 sm:px-6 sm:py-16">
    <div className="mx-auto flex w-full max-w-xl flex-col gap-12">
      <Link className="mx-auto rounded-md focus-visible:focus-ring" href={APP_ROOT}>
        <Logo className="w-40" />
      </Link>
      <h1 className="sr-only">
        <PageTitle namespace="Register" name="metaTitle" />
      </h1>
      <ApplicationForm />
    </div>
  </main>
)

export default RegisterPage
