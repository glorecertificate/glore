import { type CertificatePdfLabels } from '@/components/features/certificates/document'

const PDF_LABEL_KEYS = [
  'at',
  'date',
  'dateOfBirth',
  'from',
  'headingAfter',
  'headingBefore',
  'headingHighlight',
  'hours',
  'level',
  'mainTasks',
  'nationality',
  'partnership',
  'placeOfBirth',
  'representedBy',
  'tasksIntro',
  'title',
  'to',
  'verify',
  'volunteering',
] as const

type PdfLabelKey = (typeof PDF_LABEL_KEYS)[number]

const IMAGE_EXTENSIONS = /\.(png|jpe?g)(\?.*)?$/iu

export const pdfLabels = (translate: (key: PdfLabelKey) => string, levels: string[]) =>
  ({
    ...Object.fromEntries(PDF_LABEL_KEYS.map(key => [key, translate(key)])),
    levels,
  }) as CertificatePdfLabels

export const pdfImage = (url: string | null | undefined) => (url && IMAGE_EXTENSIONS.test(url) ? url : null)
