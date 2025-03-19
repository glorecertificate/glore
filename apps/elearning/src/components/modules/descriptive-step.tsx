import Markdown from 'react-markdown'

import { Image } from '@/components/ui/image'
import type { DescriptiveStep } from '@/lib/types'

interface DescriptiveStepViewProps {
  step: DescriptiveStep
}

export const DescriptiveStepView = ({ step }: DescriptiveStepViewProps) => (
  <div className="prose prose-slate dark:prose-invert max-w-none">
    <Markdown>{step.content}</Markdown>

    {step.images && step.images.length > 0 && (
      <div className="mt-6 space-y-4">
        {step.images.map((image, index) => (
          <div className="relative h-[300px] w-full overflow-hidden rounded-lg" key={index}>
            <Image alt={`Image for ${step.title}`} className="object-cover" fill src={image || '/placeholder.svg'} />
          </div>
        ))}
      </div>
    )}
  </div>
)
