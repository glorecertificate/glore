import { type VolunteerSummary, nextSkillCourse } from '@/actions/dashboard/core'
import { VolunteerCourses } from '@/components/features/dashboard/volunteer-courses'
import { VolunteerHero } from '@/components/features/dashboard/volunteer-hero'
import { VolunteerRequest } from '@/components/features/dashboard/volunteer-request'

export const VolunteerDashboard = ({
  firstName,
  organization,
  volunteer,
}: {
  firstName: string
  organization: string | null
  volunteer: VolunteerSummary
}) => {
  const learning = volunteer.journey.phase === 'learn'
  const next = learning ? nextSkillCourse(volunteer.courses) : null
  const compass = learning && !volunteer.compassSet

  return (
    <div className="flex flex-col gap-6" data-slot="volunteer-dashboard">
      <VolunteerHero firstName={firstName} next={next} volunteer={volunteer} />
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <VolunteerCourses
          compass={compass}
          completed={volunteer.eligibility.completedSkillCount}
          courses={volunteer.skillCourses}
          min={volunteer.eligibility.minSkills}
        />
        <VolunteerRequest organization={organization} volunteer={volunteer} />
      </div>
    </div>
  )
}
