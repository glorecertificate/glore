'use client'

import { useTranslations } from 'next-intl'

import { ArrowsMotif } from '@/components/ui/arrows-motif'
import { Image } from '@/components/ui/image'
import { Logo } from '@/components/ui/logo'
import { cn } from '@/lib/utils'

export interface ThumbnailSkill {
  level: number
  name: string
}

const PAPER = {
  '--banner': '#345372',
  '--foreground': '#304f71',
  '--ink': '#315070',
  '--leaf': '#7fbf73',
  '--mist': '#f0f0f0',
} as React.CSSProperties

const Dots = ({ level }: { level: number }) => (
  <span className="flex gap-[0.7cqw]">
    {[1, 2, 3, 4, 5].map(dot => (
      <span className={cn('size-[1.9cqw] rounded-full', dot <= level ? 'bg-(--leaf)' : 'bg-(--mist)')} key={dot} />
    ))}
  </span>
)

export const CertificateThumbnail = ({
  className,
  code,
  end,
  firstName,
  hours,
  label,
  lastName,
  location,
  logoUrl,
  organization,
  skills,
  start,
  tasks,
  ...props
}: Omit<React.ComponentProps<'figure'>, 'children'> & {
  code?: string | null
  end?: string | null
  firstName: string
  hours?: number | null
  label: string
  lastName?: string | null
  location?: string | null
  logoUrl?: string | null
  organization: string
  skills: ThumbnailSkill[]
  start?: string | null
  tasks: string[]
}) => {
  const t = useTranslations('CertificatePdf')

  return (
    <figure
      className={cn(
        '@container relative aspect-595/842 w-full overflow-hidden rounded-md border bg-white text-(--ink) shadow-sm',
        className
      )}
      data-slot="certificate-thumbnail"
      style={PAPER}
      {...props}
    >
      <figcaption className="sr-only">{label}</figcaption>
      <div aria-hidden className="absolute inset-0">
        <ArrowsMotif className="absolute right-[-12%] bottom-[2%] w-[78%]" />
        <div className="relative flex h-full flex-col gap-[3cqw] p-[4cqw]">
          <Logo className="h-[10cqw] w-auto self-start" />
          <div className="self-start bg-(--banner) px-[2cqw] py-[1.1cqw] text-[2.7cqw] font-medium tracking-wide text-white uppercase">
            {t('title')}
          </div>
          <div className="text-[6.1cqw] leading-[1.05]">
            <p className="truncate font-normal">{firstName}</p>
            <p className="truncate font-bold">{lastName}</p>
          </div>

          <div className="grid flex-1 grid-cols-[42%_1fr] gap-[4cqw]">
            <div className="flex min-w-0 flex-col gap-[3cqw] text-[2.1cqw]">
              <div className="flex flex-col gap-[0.8cqw] border-l-[0.5cqw] border-(--ink) pl-[2cqw]">
                <p className="text-[2.4cqw] font-black uppercase">{t('volunteering')}</p>
                <p>
                  {t('from')} <b>{start ?? '--'}</b> {t('to')} <b>{end ?? '--'}</b>
                </p>
                <p>
                  <b>{hours ?? '--'}</b> {t('hours')}
                </p>
                <p className="truncate">
                  {t('at')} <b>{location || '--'}</b>
                </p>
                <p className="mt-[0.8cqw]">{t('partnership')}</p>
                <div className="flex items-center gap-[1.5cqw]">
                  <p className="min-w-0 flex-1 text-[2.1cqw] leading-tight font-black uppercase">{organization}</p>
                  {logoUrl ? (
                    <Image
                      alt=""
                      className="size-[9cqw] shrink-0 object-contain"
                      height={64}
                      src={logoUrl}
                      unoptimized
                      width={64}
                    />
                  ) : (
                    <span className="size-[9cqw] shrink-0 bg-(--mist)" />
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-[0.8cqw] border-l-[0.5cqw] border-(--ink) pl-[2cqw]">
                <p className="text-[2.4cqw] font-black uppercase">{t('mainTasks')}</p>
                <ul className="flex flex-col gap-[0.8cqw]">
                  {tasks.slice(0, 4).map(task => (
                    <li className="line-clamp-2 flex gap-[1cqw] leading-tight" key={task}>
                      <span className="font-black text-(--leaf)">{'•'}</span>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <ul className="flex min-w-0 flex-col gap-[3.4cqw]">
              {skills.slice(0, 4).map(skill => (
                <li className="flex flex-col gap-[0.8cqw]" key={skill.name}>
                  <p className="truncate text-[2.5cqw] font-black text-(--leaf) uppercase">{skill.name}</p>
                  <Dots level={skill.level} />
                </li>
              ))}
            </ul>
          </div>

          {code ? <p className="font-mono text-[1.9cqw]">{code}</p> : null}
        </div>
      </div>
    </figure>
  )
}
