'use client'

import { useState } from 'react'

import { PlusCircle } from 'lucide-react'

import { CertificateCard } from '@/components/certificates/certificate-card'
import { RequestCertificateDialog } from '@/components/certificates/request-certificate-dialog'
import { Button } from '@/components/ui/button'
import type { Certificate } from '@/lib/_types'

const certificates: Certificate[] = [
  {
    id: '1',
    title: 'Introduction to Volunteering',
    organization: 'Community Helpers Association',
    issueDate: '2023-10-15',
    expiryDate: '2025-10-15',
    requestDate: '2023-09-01',
    status: 'issued',
    image: '/placeholder.svg?height=200&width=400',
  },
  {
    id: '2',
    title: 'Community Engagement Specialist',
    organization: 'Urban Outreach Initiative',
    issueDate: '2023-12-05',
    expiryDate: '2025-12-05',
    requestDate: '2023-11-01',
    status: 'issued',
    image: '/placeholder.svg?height=200&width=400',
  },
  {
    id: '3',
    title: 'Project Management for Volunteers',
    organization: 'Volunteer Leaders Network',
    status: 'pending',
    requestDate: '2024-02-20',
    image: '/placeholder.svg?height=200&width=400',
  },
  {
    id: '4',
    title: 'Leadership in Volunteer Organizations',
    organization: 'Global Volunteer Alliance',
    status: 'pending',
    requestDate: '2024-03-10',
    image: '/placeholder.svg?height=200&width=400',
  },
]

export default () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const issuedCertificates = certificates.filter(cert => cert.status === 'issued')
  const pendingCertificates = certificates.filter(cert => cert.status === 'pending')

  return (
    <div className="flex h-full flex-col">
      <header className="py-12">
        <div className="container">
          <h1 className="text-4xl font-bold">{'Your Certificates'}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{'View, manage, and request certificates for your volunteer work'}</p>
          <Button className="mt-6" onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {'Request New Certificate'}
          </Button>
        </div>
      </header>

      <main className="container flex-1 py-10">
        {issuedCertificates.length > 0 && (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{'Acquired Certificates'}</h2>
              <div className="text-sm text-muted-foreground">
                {issuedCertificates.length}
                {' certificate'}
                {issuedCertificates.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {issuedCertificates.map(certificate => (
                <CertificateCard certificate={certificate} key={certificate.id} />
              ))}
            </div>
          </section>
        )}

        {pendingCertificates.length > 0 && (
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{'Certificates Under Review'}</h2>
              <div className="text-sm text-muted-foreground">
                {pendingCertificates.length}
                {' certificate'}
                {pendingCertificates.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingCertificates.map(certificate => (
                <CertificateCard certificate={certificate} key={certificate.id} />
              ))}
            </div>
          </section>
        )}

        {issuedCertificates.length === 0 && pendingCertificates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-muted p-6">
              <PlusCircle className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium">{'No certificates yet'}</h3>
            <p className="mt-2 max-w-md text-muted-foreground">
              {'Complete modules and request certificates to showcase your volunteer skills and experience.'}
            </p>
            <Button className="mt-6" onClick={() => setIsDialogOpen(true)}>
              {'Request Your First Certificate'}
            </Button>
          </div>
        )}
      </main>

      <RequestCertificateDialog onOpenChange={setIsDialogOpen} open={isDialogOpen} />
    </div>
  )
}
