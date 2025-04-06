'use client'

import { useCallback } from 'react'

import { format } from 'date-fns'
import { Clock, Download, Eye } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Image } from '@/components/ui/image'
import type { Certificate } from '@/lib/_types'

interface CertificateCardProps {
  certificate: Certificate
}

export const CertificateCard = ({ certificate }: CertificateCardProps) => {
  const formatDate = useCallback((dateString: string) => format(new Date(dateString), 'MMMM d, yyyy'), [])

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all hover:shadow-md">
      <div className="relative h-48 w-full bg-muted">
        <Image alt={certificate.title} className="object-cover" fill src={certificate.image || '/placeholder.svg'} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute right-3 bottom-3 left-3">
          <h3 className="text-lg font-semibold text-white">{certificate.title}</h3>
          <p className="text-sm text-white/80">{certificate.organization}</p>
        </div>
      </div>

      <CardContent className="flex-1 pt-4">
        <div className="mb-4 flex items-center justify-between">
          {certificate.status === 'issued' ? (
            <Badge className="bg-green-600">{'Issued'}</Badge>
          ) : (
            <Badge className="bg-amber-500" color="secondary">
              {'Under Review'}
            </Badge>
          )}

          {certificate.status === 'issued' && certificate.expiryDate && (
            <div className="text-xs text-muted-foreground">
              {'Expires: '}
              {formatDate(certificate.expiryDate)}
            </div>
          )}

          {certificate.status === 'pending' && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="mr-1 h-3 w-3" />
              {'Requested: '}
              {formatDate(certificate.requestDate)}
            </div>
          )}
        </div>

        {certificate.status === 'issued' && certificate.issueDate && (
          <div className="text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{'Issued on:'}</span>
              <span>{formatDate(certificate.issueDate)}</span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4 pb-4">
        {certificate.status === 'issued' ? (
          <div className="flex w-full gap-2">
            <Button className="flex-1" variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              {'View'}
            </Button>
            <Button className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              {'Download'}
            </Button>
          </div>
        ) : (
          <Button className="w-full" disabled variant="outline">
            <Clock className="mr-2 h-4 w-4" />
            {'Awaiting Approval'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
