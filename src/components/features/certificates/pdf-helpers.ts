import {
  type CertificatePdfLabels,
  PDF_LABEL_KEYS,
  type PdfLabelKey,
} from '@/components/features/certificates/certificate-layout'

const IMAGE_EXTENSIONS = /\.(png|jpe?g)(\?.*)?$/iu

export const pdfLabels = (translate: (key: PdfLabelKey) => string, levels: string[]) =>
  ({
    ...Object.fromEntries(PDF_LABEL_KEYS.map(key => [key, translate(key)])),
    levels,
  }) as CertificatePdfLabels

export const pdfImage = (url: string | null | undefined) => (url && IMAGE_EXTENSIONS.test(url) ? url : null)
