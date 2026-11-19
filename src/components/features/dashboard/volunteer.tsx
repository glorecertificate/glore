import { type VolunteerSummary, nextSkillCourse } from '@/actions/dashboard/core'
import { JourneyCourses } from '@/components/features/dashboard/journey-courses'
import { JourneyRail } from '@/components/features/dashboard/journey-rail'
import { JourneyStage } from '@/components/features/dashboard/journey-stage'

const SKILL_PHASES = new Set(['draft', 'learn', 'ready'])

export const VolunteerDashboard = ({ volunteer }: { volunteer: VolunteerSummary }) => {
  const { compassSet, courses, eligibility, journey, skills } = volunteer
  const learning = journey.phase === 'learn'
  const next = learning ? nextSkillCourse(courses) : null

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22.5rem]" data-slot="volunteer-dashboard">
      <div className="flex min-w-0 flex-col gap-5">
        <JourneyStage next={next} volunteer={volunteer} />
        <JourneyCourses
          compass={learning && !compassSet}
          completed={eligibility.completedSkillCount}
          courses={courses.continuing}
          exclude={next?.slug}
          min={eligibility.minSkills}
          showSkills={SKILL_PHASES.has(journey.phase)}
          skills={skills}
        />
      </div>
      <JourneyRail volunteer={volunteer} />
    </div>
  )
}
