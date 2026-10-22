import { LegalPage } from '@/components/features/legal/legal-document'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Legal',
  title: 'terms',
})

const TermsPage = () => <LegalPage document="terms" />

export default TermsPage
