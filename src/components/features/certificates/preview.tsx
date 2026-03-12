'use client'

import dynamic from 'next/dynamic'

import { type CertificateDocumentProps } from './document'

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
    const mod = await import('./document')
    return mod.CertificateDocument
  },
  { ssr: false }
)

export const CertificatePreview = (props: CertificateDocumentProps) => (
  <PDFViewer width="100%" height="100%" showToolbar={false} style={pdfViewerStyle}>
    <CertificateDocument {...props} />
  </PDFViewer>
)
