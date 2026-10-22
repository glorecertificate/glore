import { type Route } from 'next'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export interface ChecklistEntry {
  action: string
  description: string
  done: boolean
  href?: Route
  key: string
  title: string
}

export const DashboardChecklist = ({
  entries,
  progress,
  title,
}: {
  entries: ChecklistEntry[]
  progress: string
  title: string
}) => {
  const completed = entries.filter(({ done }) => done).length
  if (completed === entries.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{progress}</CardDescription>
        <Progress aria-label={title} color="brand" value={(completed / entries.length) * 100} />
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {entries.map(({ action, description, done, href, key, title: label }) => (
            <li className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0" key={key}>
              <LucideIcon
                className={cn('size-5 shrink-0', done ? 'text-success-text' : 'text-muted-foreground')}
                name={done ? 'circle-check' : 'circle'}
              />
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-medium', done && 'text-muted-foreground line-through')}>{label}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              {!done && href && (
                <Button asChild size="sm" variant="outline">
                  <Link href={href}>{action}</Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
