import { OrganizationTabsList } from '@/components/features/organization/tabs'
import {
  PageHeaderBreadcrumb,
  PageHeaderContainer,
  PageHeaderLogo,
  PageHeaderSidebarTrigger,
} from '@/components/layout/page-header'

export const OrganizationHeader = ({
  isOrgAdmin,
  joinRequestCount,
  ...props
}: React.ComponentProps<typeof PageHeaderContainer> & { isOrgAdmin: boolean; joinRequestCount: number }) => (
  <PageHeaderContainer {...props}>
    <div className="flex items-center gap-2">
      <PageHeaderSidebarTrigger />
      <PageHeaderBreadcrumb namespace="Organization" titleKey="title" />
    </div>
    <OrganizationTabsList isOrgAdmin={isOrgAdmin} joinRequestCount={joinRequestCount} />
    <PageHeaderLogo />
  </PageHeaderContainer>
)
