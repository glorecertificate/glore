import { LegalPage } from '@/components/features/legal/legal-document'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Legal',
  title: 'qualityCharter',
})

const QualityCharterPage = () => <LegalPage document="quality-charter" />

export default QualityCharterPage
