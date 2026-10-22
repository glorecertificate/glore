import { LegalPage } from '@/components/features/legal/legal-document'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Legal',
  title: 'privacy',
})

const PrivacyPage = () => <LegalPage document="privacy" />

export default PrivacyPage
