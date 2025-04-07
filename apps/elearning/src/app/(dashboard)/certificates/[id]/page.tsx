import { notFound } from 'next/navigation'

import { appMetadata } from '@/lib/metadata'
import { type PageProps, type Path } from '@/lib/navigation'

interface CertificatePageProps extends PageProps<Path.Certificate> {}

export default async ({ params }: CertificatePageProps) => {
  const { id } = (await params) ?? {}
  if (!id) notFound()

  return `Certificate ${id}`
}

export const generateMetadata = async ({ params }: CertificatePageProps) => {
  const { id } = (await params) ?? {}
  if (!id) return await appMetadata()

  return appMetadata({
    title: `Certificate ${id}`,
    description: `Certificate ${id} description`,
  })
}
