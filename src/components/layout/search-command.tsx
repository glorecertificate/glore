'use client'

import { type Route } from 'next'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { type default as FuseType } from 'fuse.js'
import { BookOpenIcon, FileTextIcon, UsersIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { listUserCertificates } from '@/actions/certificates/queries'
import { listCourses } from '@/actions/courses/queries'
import { getOrganizationPanel } from '@/actions/organizations/queries'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { type Certificate } from '@/db/queries/certificate'
import { type Course } from '@/db/queries/course'
import { type OrganizationMember } from '@/db/queries/organization'
import { useDebounce } from '@/hooks/use-debounce'
import { useI18n } from '@/hooks/use-i18n'
import { useSession } from '@/hooks/use-session'

export const SearchCommand = ({ open, onOpenChange, ...props }: React.ComponentProps<typeof Dialog>) => {
  const t = useTranslations('Search')
  const { push } = useRouter()
  const { localize } = useI18n()
  const { user } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 200)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const loaded = useRef(false)
  const [Fuse, setFuse] = useState<typeof FuseType | null>(null)

  useEffect(() => {
    if (!open || loaded.current) return
    loaded.current = true

    const load = async () => {
      const [{ default: F }, { data: coursesData }] = await Promise.all([import('fuse.js'), listCourses()])
      setFuse(() => F)
      if (coursesData) setCourses(coursesData)

      if (!user.canEdit) {
        const { data } = await listUserCertificates()
        if (data) setCertificates(data)
      }
      if (user.isOrgAdmin) {
        const result = await getOrganizationPanel()
        if (result.data) setMembers(result.data.members)
      }
    }

    void load()
  }, [open, user.canEdit, user.isOrgAdmin])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const searchableCourses = courses.map(c => ({ ...c, localTitle: localize(c.title) }))

  const courseFuse = Fuse
    ? new Fuse(searchableCourses, {
        ignoreLocation: true,
        includeScore: true,
        keys: ['localTitle', 'slug'],
        threshold: 0.4,
      })
    : null

  const certFuse = Fuse
    ? new Fuse(certificates, {
        ignoreLocation: true,
        includeScore: true,
        keys: ['handle', 'organization.name'],
        threshold: 0.4,
      })
    : null

  const memberFuse = Fuse
    ? new Fuse(members, {
        ignoreLocation: true,
        includeScore: true,
        keys: ['fullName', 'user.email'],
        threshold: 0.4,
      })
    : null

  const courseResults =
    debouncedQuery.trim() && courseFuse
      ? courseFuse
          .search(debouncedQuery)
          .slice(0, 8)
          .map(r => r.item)
      : searchableCourses.slice(0, 5)

  const certResults =
    debouncedQuery.trim() && certFuse
      ? certFuse
          .search(debouncedQuery)
          .slice(0, 5)
          .map(r => r.item)
      : certificates.slice(0, 5)

  const memberResults =
    debouncedQuery.trim() && memberFuse
      ? memberFuse
          .search(debouncedQuery)
          .slice(0, 5)
          .map(r => r.item)
      : members.slice(0, 5)

  const hasResults = courseResults.length > 0 || certResults.length > 0 || memberResults.length > 0

  const navigate = (href: Route) => {
    onOpenChange?.(false)
    push(href)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{t('trigger')}</DialogTitle>
        <DialogDescription>{t('placeholder')}</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0" showClose={false}>
        <Command
          shouldFilter={false}
          className="**:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:size-5 [&_[cmdk-item]_svg]:size-5 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group]]:px-2 **:[[cmdk-input]]:h-12 **:[[cmdk-item]]:px-2 **:[[cmdk-item]]:py-3"
        >
          <CommandInput placeholder={t('placeholder')} value={query} onValueChange={setQuery} />
          <CommandList>
            {!hasResults && debouncedQuery.trim() && <CommandEmpty>{t('noResults')}</CommandEmpty>}

            {courseResults.length > 0 && (
              <CommandGroup heading={t('courses')}>
                {courseResults.map(course => (
                  <CommandItem
                    key={course.id}
                    value={`course-${course.id}`}
                    onSelect={() => {
                      onOpenChange?.(false)
                      push(`/courses/${course.slug}`)
                    }}
                  >
                    <BookOpenIcon />
                    <span>{course.localTitle}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {certResults.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t('certificates')}>
                  {certResults.map(cert => (
                    <CommandItem
                      key={cert.id}
                      value={`cert-${cert.id}`}
                      onSelect={() => {
                        onOpenChange?.(false)
                        push(`/certificates/${cert.id}`)
                      }}
                    >
                      <FileTextIcon />
                      <span>{cert.handle}</span>
                      <CommandShortcut>{cert.organization.name}</CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {memberResults.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t('members')}>
                  {memberResults.map(member => (
                    <CommandItem
                      key={member.id}
                      value={`member-${member.id}`}
                      onSelect={() => navigate('/organization')}
                    >
                      <UsersIcon />
                      <span>{member.fullName}</span>
                      <CommandShortcut>{member.user.email}</CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
