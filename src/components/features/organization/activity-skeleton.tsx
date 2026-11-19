'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const ActivitySkeleton = () => (
  <div className="flex flex-col gap-6">
    <Card>
      <CardContent className="flex flex-col gap-6">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="flex gap-4" key={index}>
            <Skeleton className="mt-1.5 size-2.5 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
)
