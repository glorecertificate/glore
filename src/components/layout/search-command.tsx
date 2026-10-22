'use client'

import { type Route } from 'next'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { type default as Fuse } from 'fuse.js'
import { useTranslations } from 'next-intl'

import { listCourses } from '@/actions/courses/queries'
import { MIN_QUERY_LENGTH } from '@/actions/shell/scope'
import { type WorkspaceSearchResult, searchWorkspace } from '@/actions/shell/search'
import { useDocsSearch } from '@/components/features/docs/use-docs-search'
import { LucideIcon } from '@/components/icons/lucide'
import {
  type NavigationGroup,
  entriesFor,
  matchesEntry,
  showsOrganizationSwitcher,
} from '@/components/layout/navigation'
import { useNavigationLabels } from '@/components/layout/use-navigation-labels'
import { useI18n } from '@/components/providers/i18n'
import { useSession } from '@/components/providers/session'
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
import { type Course } from '@/db/queries/course'
import { useDebounce } from '@/hooks/use-debounce'
import { APP_ROOT } from '@/lib/constants'
import { titleize } from '@/lib/utils'

const IDLE_GROUPS: NavigationGroup[] = ['pages', 'actions', 'admin']
const GROUPS: NavigationGroup[] = ['pages', 'actions', 'settings', 'organization', 'admin']

interface RemoteResults extends WorkspaceSearchResult {
  failed: boolean
  query: string
}

export const SearchCommand = ({ open, onOpenChange, ...props }: React.ComponentProps<typeof Dialog>) => {
  const t = useTranslations('Search')
  const { push } = useRouter()
  const { localize } = useI18n()
  const { organization: active, setOrganization, user } = useSession()
  const docs = useDocsSearch()
  const [courses, setCourses] = useState<Course[]>([])
  const [fuse, setFuse] = useState<typeof Fuse | null>(null)
  const [query, setQuery] = useState('')
  const [remote, setRemote] = useState<RemoteResults | null>(null)
  const debouncedQuery = useDebounce(query, 200)
  const loaded = useRef(false)

  const term = debouncedQuery.trim()
  const searching = term.length >= MIN_QUERY_LENGTH

  useEffect(() => {
    if (!open || loaded.current) return
    loaded.current = true

    const load = async () => {
      const [{ default: F }, { data }] = await Promise.all([import('fuse.js'), listCourses(), docs.load()])
      setFuse(() => F)
      if (data) setCourses(data)
    }

    void load()
  }, [docs, open])

  useEffect(() => {
    if (!searching) return undefined
    let current = true

    const run = async () => {
      const { data, error } = await searchWorkspace(term)
      if (current) {
        setRemote({
          certificates: data?.certificates ?? [],
          failed: Boolean(error),
          members: data?.members ?? [],
          query: term,
        })
      }
    }

    void run()
    return () => {
      current = false
    }
  }, [searching, term])

  const handleOpenChange = (next: boolean) => {
    if (!next) setQuery('')
    onOpenChange?.(next)
  }

  const navigate = (href: string) => {
    handleOpenChange(false)
    push(href as Route)
  }

  const selectOrganization = (id: number) => {
    handleOpenChange(false)
    setOrganization(id)
    push(APP_ROOT)
  }

  const labels = useNavigationLabels()

  const headings = {
    actions: t('actions'),
    admin: t('admin'),
    organization: t('organization'),
    pages: t('pages'),
    settings: t('settings'),
  } satisfies Record<NavigationGroup, string>

  const groups = (searching ? GROUPS : IDLE_GROUPS).map(group => ({
    entries: entriesFor(user, group).filter(
      entry => !searching || matchesEntry(`${headings[group]} ${labels[entry.id]}`, term)
    ),
    group,
  }))

  const searchableCourses = courses.map(c => ({ ...c, localTitle: localize(c.title) }))
  const courseResults =
    searching && fuse
      ? new fuse(searchableCourses, { ignoreLocation: true, keys: ['localTitle', 'slug'], threshold: 0.4 })
          .search(term)
          .slice(0, 6)
          .map(r => r.item)
      : searching
        ? []
        : searchableCourses.slice(0, 5)

  const docResults = searching ? docs.search(term, 5) : []
  const remoteResults = searching && remote?.query === term ? remote : null
  const certificateResults = remoteResults?.certificates ?? []
  const memberResults = remoteResults?.members ?? []
  const organizationResults =
    showsOrganizationSwitcher(user) && user.memberships.length > 1
      ? user.memberships.filter(
          ({ organization }) => !searching || matchesEntry(`${t('organizations')} ${organization.name}`, term)
        )
      : []

  const hasResults =
    groups.some(({ entries }) => entries.length > 0) ||
    organizationResults.length > 0 ||
    courseResults.length > 0 ||
    docResults.length > 0 ||
    certificateResults.length > 0 ||
    memberResults.length > 0
  const pendingRemote = searching && !remoteResults

  return (
    <Dialog onOpenChange={handleOpenChange} open={open} {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{t('trigger')}</DialogTitle>
        <DialogDescription>{t('placeholder')}</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0" showClose={false}>
        <Command
          className="**:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:size-5 [&_[cmdk-item]_svg]:size-5 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group]]:px-2 **:[[cmdk-input]]:h-12 **:[[cmdk-item]]:px-2 **:[[cmdk-item]]:py-3"
          shouldFilter={false}
        >
          <CommandInput onValueChange={setQuery} placeholder={t('placeholder')} value={query} />
          <CommandList>
            {!hasResults && searching && !pendingRemote && <CommandEmpty>{t('noResults')}</CommandEmpty>}
            {pendingRemote && <p className="px-4 py-3 text-sm text-muted-foreground">{t('searching')}</p>}
            {remoteResults?.failed && <p className="px-4 py-3 text-sm text-destructive">{t('failed')}</p>}

            {groups.map(({ entries, group }) =>
              entries.length > 0 ? (
                <CommandGroup heading={headings[group]} key={group}>
                  {entries.map(entry => (
                    <CommandItem key={entry.id} onSelect={() => navigate(entry.href)} value={`entry-${entry.id}`}>
                      <LucideIcon name={entry.icon} />
                      <span>{labels[entry.id]}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null
            )}

            {organizationResults.length > 0 && (
              <CommandGroup heading={t('organizations')}>
                {organizationResults.map(({ organization, role }) => (
                  <CommandItem
                    key={organization.id}
                    onSelect={() => selectOrganization(organization.id)}
                    value={`organization-${organization.id}`}
                  >
                    <LucideIcon name="building-2" />
                    <span>{organization.name}</span>
                    <CommandShortcut>{organization.id === active?.id ? t('current') : titleize(role)}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {courseResults.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t('courses')}>
                  {courseResults.map(course => (
                    <CommandItem
                      key={course.id}
                      onSelect={() => navigate(`/courses/${course.slug}`)}
                      value={`course-${course.id}`}
                    >
                      <LucideIcon name="book-open" />
                      <span>{course.localTitle}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {docResults.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t('docs')}>
                  {docResults.map(doc => (
                    <CommandItem key={doc.articleId} onSelect={() => navigate(doc.href)} value={`doc-${doc.articleId}`}>
                      <LucideIcon name="book-marked" />
                      <span>{doc.title}</span>
                      <CommandShortcut>{doc.categoryTitle}</CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {certificateResults.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={t('certificates')}>
                  {certificateResults.map(cert => (
                    <CommandItem
                      key={cert.id}
                      onSelect={() => navigate(`/certificates/${cert.id}`)}
                      value={`certificate-${cert.id}`}
                    >
                      <LucideIcon name="file-text" />
                      <span>{cert.code ?? cert.handle}</span>
                      <CommandShortcut>{cert.isOwn ? cert.organizationName : cert.holderName}</CommandShortcut>
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
                      onSelect={() => navigate('/organization?tab=members')}
                      value={`member-${member.id}`}
                    >
                      <LucideIcon name="users" />
                      <span>{member.name}</span>
                      <CommandShortcut>{member.email}</CommandShortcut>
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
