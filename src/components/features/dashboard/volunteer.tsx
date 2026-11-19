import { type VolunteerSummary, nextSkillCourse } from '@/actions/dashboard/core'
import { JourneyPath } from '@/components/features/dashboard/journey-path'
import { JourneyRail } from '@/components/features/dashboard/journey-rail'
import { JourneyStage } from '@/components/features/dashboard/journey-stage'

export const VolunteerDashboard = ({ volunteer }: { volunteer: VolunteerSummary }) => {
  const learning = volunteer.journey.phase === 'learn'
  const next = learning ? nextSkillCourse(volunteer.courses) : null
  const compass = learning && !volunteer.compassSet

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]" data-slot="volunteer-dashboard">
      <JourneyRail
        className="order-2"
        path={<JourneyPath compass={compass} courses={volunteer.courses.continuing} exclude={next?.slug} />}
        volunteer={volunteer}
      />
      <JourneyStage className="order-1" next={next} volunteer={volunteer} />
    </div>
  )
}
