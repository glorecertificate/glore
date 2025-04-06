import { notFound } from 'next/navigation'

import { appMetadata } from '@/lib/metadata'
import { type PageProps } from '@/lib/navigation'

interface CertificatePageProps extends PageProps<{ uuid: string }> {}

export default async ({ params }: CertificatePageProps) => {
  const { uuid } = (await params) ?? {}
  if (!uuid) notFound()

  return `Certificate ${uuid}`
}

export const generateMetadata = async ({ params }: CertificatePageProps) => {
  const { uuid } = (await params) ?? {}
  if (!uuid) return await appMetadata()

  return appMetadata({
    title: `Certificate ${uuid}`,
    description: `Certificate ${uuid} description`,
  })
}
