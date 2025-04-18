import { CertificateView } from '@/components/features/certificates/certificate-view'
import { generateLocalizedMetadata } from '@/lib/metadata'

export default () => <CertificateView />

export const generateMetadata = generateLocalizedMetadata({
  title: 'Navigation.certificate',
})
