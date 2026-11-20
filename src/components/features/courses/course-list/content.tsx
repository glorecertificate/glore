import { loadViewerInvitations } from '@/actions/shell/invitations-core'
import { getViewerContext } from '@/actions/viewer'
import { CourseListSection } from '@/components/features/courses/course-list/section'
import { SkillCompassSection } from '@/components/features/courses/skill-compass/section'
import { NoOrganization } from '@/components/features/dashboard/no-organization'

export const CourseListContent = async () => {
  const { role, user } = await getViewerContext()
  if (!user.canEdit && role === null) {
    return <NoOrganization context="courses" invitations={await loadViewerInvitations()} />
  }

  return (
    <>
      <SkillCompassSection />
      <CourseListSection />
    </>
  )
}
