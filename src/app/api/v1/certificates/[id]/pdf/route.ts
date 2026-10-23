import { getAuthUser } from '@/actions/auth'
import { certificatePdf } from '@/actions/certificates/pdf'
import { findCertificate } from '@/actions/certificates/queries'
import { clientAddress, isRateLimited } from '@/lib/rate-limit'

export const GET = async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) return new Response(null, { status: 404 })
  if (!(await getAuthUser())) return new Response(null, { status: 401 })
  if (await isRateLimited(`certificate-pdf:${await clientAddress()}`, 30, 60_000)) {
    return new Response(null, { headers: { 'retry-after': '60' }, status: 429 })
  }

  const { data, error } = await findCertificate(id)
  if (error || !data) return new Response(null, { status: 404 })
  if (data.isRevoked) return new Response(null, { status: 410 })

  const pdf = await certificatePdf(id)
  if (!pdf) return new Response(null, { status: 404 })

  return new Response(new Uint8Array(pdf.buffer), {
    headers: {
      'cache-control': 'private, no-store',
      'content-disposition': `inline; filename="glore-certificate-${pdf.handle}.pdf"`,
      'content-type': 'application/pdf',
    },
  })
}
