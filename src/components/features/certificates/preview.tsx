'use client'

import dynamic from 'next/dynamic'

import { type CertificateDocumentProps } from '@/components/features/certificates/document'

const pdfViewerStyle = { border: 'none', borderRadius: 8 }

const PDFViewer = dynamic(
  async () => {
    const mod = await import('@react-pdf/renderer')
    return mod.PDFViewer
  },
  { ssr: false }
)

const CertificateDocument = dynamic(
  async () => {
    const mod = await import('@/components/features/certificates/document')
    return mod.CertificateDocument
  },
  { ssr: false }
)

export const CertificatePreview = (props: CertificateDocumentProps) => (
  <PDFViewer width="100%" height="100%" showToolbar={false} style={pdfViewerStyle}>
    <CertificateDocument {...props} />
  </PDFViewer>
)
