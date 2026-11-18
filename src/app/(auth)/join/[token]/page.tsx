import { Suspense } from 'react'

import { getAuthUser } from '@/actions/auth'
import { getInviteLinkPreview } from '@/actions/organizations/previews'
import { InvitationStatus } from '@/components/features/organization/invite/invitation-status'
import { JoinLinkCard } from '@/components/features/organization/invite/join-link-card'
import { PublicShell } from '@/components/features/organization/invite/public-shell'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'JoinLink',
    referrer: 'no-referrer',
    robots: { follow: false, index: false },
    title: 'metaTitle',
  })

const JoinContent = async ({ params }: { params: PageProps<'/join/[token]'>['params'] }) => {
  const [{ token }, user] = await Promise.all([params, getAuthUser()])
  const link = await getInviteLinkPreview(token, user?.id)
  const signedIn = Boolean(user)

  if (!link) return <InvitationStatus signedIn={signedIn} status="invalid" />
  if (link.state !== 'active') {
    return <InvitationStatus organization={link.organization.name} signedIn={signedIn} status={link.state} />
  }

  if (link.isMember) return <InvitationStatus organization={link.organization.name} signedIn status="member" />

  return (
    <JoinLinkCard
      email={user?.email}
      organization={link.organization}
      requiresApproval={link.requiresApproval}
      role={link.role}
      signedIn={signedIn}
      token={token}
    />
  )
}

const JoinPage = ({ params }: PageProps<'/join/[token]'>) => (
  <PublicShell>
    <Suspense fallback={<LoadingFallback />}>
      <JoinContent params={params} />
    </Suspense>
  </PublicShell>
)

export default JoinPage
