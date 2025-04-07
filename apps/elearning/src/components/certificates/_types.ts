export type CertificateStatus = 'issued' | 'pending' | 'rejected'

export interface Certificate {
  expiryDate?: string
  id: string
  image: string
  issueDate?: string
  organization: string
  requestDate: string
  status: CertificateStatus
  title: string
}
