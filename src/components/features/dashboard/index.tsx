import { type DashboardData } from '@/actions/dashboard/core'
import { EditorDashboard } from '@/components/features/dashboard/editor'
import { ManagerDashboard } from '@/components/features/dashboard/manager'
import { MemberDashboard } from '@/components/features/dashboard/member'
import { NoOrganization } from '@/components/features/dashboard/no-organization'
import { TutorDashboard } from '@/components/features/dashboard/tutor'

export const DashboardContent = ({ data }: { data: DashboardData }) => {
  if (data.view === 'editor') {
    return <EditorDashboard editor={data.editor} firstName={data.firstName} organization={data.organization} />
  }
  if (data.view === 'manager') {
    return <ManagerDashboard firstName={data.firstName} manager={data.manager} organization={data.organization} />
  }
  if (data.view === 'tutor') {
    return (
      <TutorDashboard
        firstName={data.firstName}
        notifications={data.notifications}
        organization={data.organization}
        tutor={data.tutor}
      />
    )
  }
  if (data.view === 'volunteer' || data.view === 'learner') {
    return (
      <MemberDashboard
        firstName={data.firstName}
        member={data.member}
        organization={data.organization}
        view={data.view}
      />
    )
  }
  return <NoOrganization firstName={data.firstName} />
}
