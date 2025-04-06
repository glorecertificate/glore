import CertificatesView from '@/components/certificates/certificates-view'
import { generateAppMetadata } from '@/lib/metadata'

export default () => <CertificatesView />

export const generateMetadata = generateAppMetadata({
  title: 'Navigation.certificates',
})
