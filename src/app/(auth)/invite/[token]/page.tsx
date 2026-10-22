import { Suspense } from 'react'

import { getAuthUser } from '@/actions/auth'
import { getInvitationPreview } from '@/actions/organizations/previews'
import { InvitationCard } from '@/components/features/organization/invite/invitation-card'
import { InvitationStatus } from '@/components/features/organization/invite/invitation-status'
import { PublicShell } from '@/components/features/organization/invite/public-shell'
import { maskEmail } from '@/components/features/organization/utils'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { normalizeEmail } from '@/db/mutations/invitation'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Invite',
    referrer: 'no-referrer',
    robots: { follow: false, index: false },
    title: 'metaTitle',
  })

const InviteContent = async ({
  params,
  searchParams,
}: {
  params: PageProps<'/invite/[token]'>['params']
  searchParams: PageProps<'/invite/[token]'>['searchParams']
}) => {
  const [{ token }, { proof }] = await Promise.all([params, searchParams])
  const proofValue = typeof proof === 'string' ? proof : undefined
  const [user, invitation] = await Promise.all([getAuthUser(), getInvitationPreview(token, proofValue)])
  const signedIn = Boolean(user)

  if (!invitation) return <InvitationStatus signedIn={signedIn} status="invalid" />
  if (invitation.state !== 'pending') {
    return (
      <InvitationStatus organization={invitation.organization.name} signedIn={signedIn} status={invitation.state} />
    )
  }

  const props = {
    email: invitation.email,
    expiresAt: invitation.expiresAt,
    inviterName: invitation.inviterName,
    message: invitation.message,
    organization: invitation.organization,
    role: invitation.role,
    token,
  }

  if (!user) {
    return (
      <InvitationCard
        {...props}
        proof={invitation.proofValid ? proofValue : undefined}
        view={invitation.accountExists ? 'sign_in' : 'create_account'}
      />
    )
  }

  const isRecipient = invitation.userId
    ? invitation.userId === user.id
    : normalizeEmail(user.email) === normalizeEmail(invitation.email)

  if (isRecipient) return <InvitationCard {...props} view="accept" />
  return <InvitationCard {...props} currentEmail={user.email} email={maskEmail(invitation.email)} view="mismatch" />
}

const InvitePage = ({ params, searchParams }: PageProps<'/invite/[token]'>) => (
  <PublicShell>
    <Suspense fallback={<LoadingFallback />}>
      <InviteContent params={params} searchParams={searchParams} />
    </Suspense>
  </PublicShell>
)

export default InvitePage
