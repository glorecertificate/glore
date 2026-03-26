import 'server-only'

import { createElement } from 'react'

import { CertificateDocument, type CertificateDocumentProps } from '@/components/features/certificates/document'

export const generateCertificatePdf = async (props: CertificateDocumentProps) => {
  const { renderToBuffer } = await import('@react-pdf/renderer')
  return renderToBuffer(createElement(CertificateDocument, props) as Parameters<typeof renderToBuffer>[0])
}
