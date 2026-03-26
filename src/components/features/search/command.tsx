'use client'

import { type Route } from 'next'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { type default as FuseType } from 'fuse.js'
import { BookOpenIcon, FileTextIcon, UsersIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { listUserCertificates } from '@/actions/certificate'
import { getOrganizationPanel } from '@/actions/organization-queries'
import { useCourses } from '@/components/providers/courses-context'
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
import { type OrganizationMember } from '@/db/queries/organization'
import { useDebounce } from '@/hooks/use-debounce'
import { useI18n } from '@/hooks/use-i18n'
import { useSession } from '@/hooks/use-session'

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const SearchCommand = ({ open, onOpenChange }: SearchCommandProps) => {
  const t = useTranslations('Search')
  const router = useRouter()
  const { localize } = useI18n()
  const { user } = useSession()
  const { courses } = useCourses()
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
      const { default: F } = await import('fuse.js')
      setFuse(() => F)

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

  const searchableCourses = useMemo(
    () => courses.map(c => ({ ...c, localTitle: localize(c.title) })),
    [courses, localize]
  )

  const courseFuse = useMemo(
    () =>
      Fuse
        ? new Fuse(searchableCourses, {
            ignoreLocation: true,
            includeScore: true,
            keys: ['localTitle', 'slug'],
            threshold: 0.4,
          })
        : null,
    [Fuse, searchableCourses]
  )

  const certFuse = useMemo(
    () =>
      Fuse
        ? new Fuse(certificates, {
            ignoreLocation: true,
            includeScore: true,
            keys: ['handle', 'organization.name'],
            threshold: 0.4,
          })
        : null,
    [Fuse, certificates]
  )

  const memberFuse = useMemo(
    () =>
      Fuse
        ? new Fuse(members, {
            ignoreLocation: true,
            includeScore: true,
            keys: ['fullName', 'user.email'],
            threshold: 0.4,
          })
        : null,
    [Fuse, members]
  )

  const courseResults = useMemo(
    () =>
      debouncedQuery.trim() && courseFuse
        ? courseFuse
            .search(debouncedQuery)
            .slice(0, 8)
            .map(r => r.item)
        : searchableCourses.slice(0, 5),
    [courseFuse, debouncedQuery, searchableCourses]
  )

  const certResults = useMemo(
    () =>
      debouncedQuery.trim() && certFuse
        ? certFuse
            .search(debouncedQuery)
            .slice(0, 5)
            .map(r => r.item)
        : certificates.slice(0, 5),
    [certFuse, certificates, debouncedQuery]
  )

  const memberResults = useMemo(
    () =>
      debouncedQuery.trim() && memberFuse
        ? memberFuse
            .search(debouncedQuery)
            .slice(0, 5)
            .map(r => r.item)
        : members.slice(0, 5),
    [debouncedQuery, memberFuse, members]
  )

  const hasResults = courseResults.length > 0 || certResults.length > 0 || memberResults.length > 0

  const navigate = (href: string) => {
    onOpenChange(false)
    router.push(href as Route)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>{t('trigger')}</DialogTitle>
        <DialogDescription>{t('placeholder')}</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0" showClose={false}>
        <Command
          shouldFilter={false}
          className="**:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:size-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:size-5"
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
                    onSelect={() => navigate(`/courses/${course.slug}`)}
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
                      onSelect={() => navigate(`/certificates/${cert.id}`)}
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
