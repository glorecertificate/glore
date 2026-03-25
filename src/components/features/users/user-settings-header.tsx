import { UserSettingsTabsList } from '@/components/features/users/user-settings-tabs'
import {
  PageHeaderBreadcrumb,
  PageHeaderContainer,
  PageHeaderLogo,
  PageHeaderSidebarTrigger,
} from '@/components/layout/page-header'

export const UserSettingsHeader = (props: React.ComponentProps<typeof PageHeaderContainer>) => (
  <PageHeaderContainer {...props}>
    <div className="flex items-center gap-2">
      <PageHeaderSidebarTrigger />
      <PageHeaderBreadcrumb namespace="Users" titleKey="settingsTitle" />
    </div>
    <UserSettingsTabsList />
    <PageHeaderLogo />
  </PageHeaderContainer>
)
