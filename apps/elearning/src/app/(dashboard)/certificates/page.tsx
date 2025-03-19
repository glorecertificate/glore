import CertificatesView from '@/components/certificates/certificates-view'
import { metadataFn } from '@/lib/metadata'

export default () => <CertificatesView />

export const generateMetadata = metadataFn({
  title: 'Navigation.certificates',
})
