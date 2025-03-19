import { notFound } from 'next/navigation'

import { metadata } from '@/lib/metadata'
import { type PageProps } from '@/lib/types'

interface CertificatePageProps extends PageProps<{ uuid: string }> {}

export default async ({ params }: CertificatePageProps) => {
  const { uuid } = (await params) ?? {}
  if (!uuid) notFound()

  return `Certificate ${uuid}`
}

export const generateMetadata = async ({ params }: CertificatePageProps) => {
  const { uuid } = (await params) ?? {}
  if (!uuid) return await metadata()

  return metadata({
    title: `Certificate ${uuid}`,
    description: `Certificate ${uuid} description`,
  })
}
