import { getAuthUser } from '@/actions/auth'
import { certificatePdf } from '@/actions/certificates/pdf'
import { findCertificate } from '@/actions/certificates/queries'

export const GET = async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) return new Response(null, { status: 404 })
  if (!(await getAuthUser())) return new Response(null, { status: 401 })

  const { error } = await findCertificate(id)
  if (error) return new Response(null, { status: 404 })

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
