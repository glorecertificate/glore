'use client'

import { ExperienceFields, TaskFields } from '@/components/features/certificates/experience-fields'
import { SectionNote } from '@/components/features/certificates/new/section-note'

export const ExperienceStep = ({ comments }: { comments?: { experience?: string; tasks?: string } }) => (
  <div className="flex flex-col gap-5">
    <SectionNote comment={comments?.experience} />
    <ExperienceFields />
    <SectionNote comment={comments?.tasks} />
    <TaskFields />
  </div>
)
