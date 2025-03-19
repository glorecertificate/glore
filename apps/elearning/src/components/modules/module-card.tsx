'use client'

import { useCallback, useMemo } from 'react'

import { ArrowRightIcon, CalendarIcon, CheckCircleIcon, ClockIcon, PlayIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { type ModuleProgress } from '@/lib/types'

interface ModuleCardProps {
  module: ModuleProgress
}

export const ModuleCard = ({ module }: ModuleCardProps) => {
  const formatDuration = useCallback((minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`
  }, [])

  const moduleDate = useMemo(() => new Date(module.dateAdded as string).toLocaleDateString(), [module.dateAdded])

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="relative h-48 w-full">
        <Image alt={module.title} className="object-cover" fill src={module.image || '/placeholder.svg'} />
        {module.status === 'completed' && (
          <div className="absolute top-2 right-2 rounded-full bg-green-500 p-1 text-white">
            <CheckCircleIcon className="h-5 w-5" />
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">{module.title}</h3>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="mb-4 text-sm text-muted-foreground">{module.description}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {module.difficulty && (
            <Badge className="text-xs" variant="outline">
              {module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1)}
            </Badge>
          )}
          {module.duration && (
            <Badge className="flex items-center text-xs" variant="outline">
              <ClockIcon className="mr-1 h-3 w-3" />
              {formatDuration(module.duration)}
            </Badge>
          )}
          {module.dateAdded && (
            <Badge className="flex items-center text-xs" variant="outline">
              <CalendarIcon className="mr-1 h-3 w-3" />
              {moduleDate}
            </Badge>
          )}
        </div>
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center">
            {module.status === 'not-started' ? <PlayIcon className="mr-1 h-4 w-4" /> : <ClockIcon className="mr-1 h-4 w-4" />}
            {module.completedLessons}
            {' / '}
            {module.totalLessons} {'lessons'}
          </span>
          <span>
            {module.progress}
            {'% complete'}
          </span>
        </div>
        <Progress className="h-2" value={module.progress} />
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/modules/${module.id}`}>
            {module.status === 'not-started' && 'Start Module'}
            {module.status === 'in-progress' && 'Continue Learning'}
            {module.status === 'completed' && 'Review Module'}
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
