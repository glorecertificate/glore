import { type VolunteerSummary, nextSkillCourse } from '@/actions/dashboard/core'
import { JourneyBar } from '@/components/features/dashboard/journey-bar'
import { JourneyPath } from '@/components/features/dashboard/journey-path'
import { JourneyRail } from '@/components/features/dashboard/journey-rail'
import { JourneyStage } from '@/components/features/dashboard/journey-stage'

export const VolunteerDashboard = ({ volunteer }: { volunteer: VolunteerSummary }) => {
  const learning = volunteer.journey.phase === 'learn'
  const next = learning ? nextSkillCourse(volunteer.courses) : null
  const compass = learning && !volunteer.compassSet

  return (
    <div
      className="grid items-start gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:gap-10"
      data-slot="volunteer-dashboard"
    >
      <JourneyRail
        className="max-lg:hidden"
        path={
          <JourneyPath
            compass={compass}
            courses={volunteer.courses.continuing}
            exclude={next?.slug}
            id="journey-path-rail"
          />
        }
        volunteer={volunteer}
      />
      <JourneyBar className="lg:hidden" journey={volunteer.journey} />
      <JourneyStage next={next} volunteer={volunteer} />
      <JourneyPath
        className="lg:hidden"
        compass={compass}
        courses={volunteer.courses.continuing}
        exclude={next?.slug}
        id="journey-path-bar"
      />
    </div>
  )
}
