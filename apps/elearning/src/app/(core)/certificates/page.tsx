import { CertificateView } from '@/components/features/certificates/certificate-view'
import { generatePageMetadata } from '@/lib/metadata'

export const generateMetadata = generatePageMetadata({
  title: 'Navigation.certificates',
})

export default () => <CertificateView />
