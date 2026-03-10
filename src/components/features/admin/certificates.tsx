import { useState } from 'react'

import { AwardIcon, DownloadIcon, FilterIcon, MoreHorizontalIcon, SearchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const certifications = [
  {
    created: '2022-04-10',
    id: '1',
    issuedCount: 156,
    organization: 'Community Helpers Association',
    status: 'Active',
    title: 'Introduction to Volunteering',
  },
  {
    created: '2022-06-15',
    id: '2',
    issuedCount: 89,
    organization: 'Urban Outreach Initiative',
    status: 'Active',
    title: 'Community Engagement Specialist',
  },
  {
    created: '2022-08-22',
    id: '3',
    issuedCount: 112,
    organization: 'Volunteer Leaders Network',
    status: 'Active',
    title: 'Project Management for Volunteers',
  },
  {
    created: '2022-10-05',
    id: '4',
    issuedCount: 78,
    organization: 'Global Volunteer Alliance',
    status: 'Active',
    title: 'Leadership in Volunteer Organizations',
  },
  {
    created: '2023-01-18',
    id: '5',
    issuedCount: 45,
    organization: 'Local Impact Group',
    status: 'Inactive',
    title: 'Fundraising Fundamentals',
  },
  {
    created: '2023-03-09',
    id: '6',
    issuedCount: 67,
    organization: 'Youth Empowerment Coalition',
    status: 'Active',
    title: 'Volunteer Coordination',
  },
  {
    created: '2023-05-27',
    id: '7',
    issuedCount: 203,
    organization: 'Disaster Relief Network',
    status: 'Active',
    title: 'Crisis Response Training',
  },
  {
    created: '2023-07-14',
    id: '8',
    issuedCount: 0,
    organization: 'Environmental Action Team',
    status: 'Draft',
    title: 'Environmental Advocacy',
  },
]

export const AdminCertificates = () => {
  const [searchTerm, setSearchIconTerm] = useState('')
  const [selectedOrganization, setSelectedOrganization] = useState<string | undefined>()
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>()

  const filteredCertifications = certifications.filter(cert => {
    const matchesSearchIcon = cert.title.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesOrganization = !selectedOrganization || cert.organization === selectedOrganization
    const matchesStatus = !selectedStatus || cert.status === selectedStatus

    return matchesSearchIcon && matchesOrganization && matchesStatus
  })

  const clearFilterIcons = () => {
    setSelectedOrganization(undefined)
    setSelectedStatus(undefined)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Certifications Management</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <DownloadIcon className="mr-2 size-4" />
            Export
          </Button>
          <Button>
            <AwardIcon className="mr-2 size-4" />
            Add Certification
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-96">
          <SearchIcon className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            className="w-full pl-9"
            onChange={e => setSearchIconTerm(e.target.value)}
            placeholder="SearchIcon certifications..."
            type="search"
            value={searchTerm}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <FilterIcon className="mr-2 size-4" />
                Organization
                {selectedOrganization && <span className="ml-1 size-2 rounded-full bg-brand-secondary" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>FilterIcon by Organization</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[...new Set(certifications.map(cert => cert.organization))].map(org => (
                <DropdownMenuItem key={org} onClick={() => setSelectedOrganization(org)}>
                  {org}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <FilterIcon className="mr-2 size-4" />
                Status
                {selectedStatus && <span className="ml-1 size-2 rounded-full bg-brand-secondary" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>FilterIcon by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedStatus('Active')}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('Inactive')}>Inactive</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('Draft')}>Draft</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {(selectedOrganization || selectedStatus) && (
            <Button onClick={clearFilterIcons} size="sm" variant="ghost">
              Clear FilterIcons
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12.5">
                <Checkbox />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCertifications.length === 0 ? (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={7}>
                  No certifications found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCertifications.map(cert => (
                <TableRow key={cert.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium">{cert.title}</TableCell>
                  <TableCell>{cert.organization}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div
                        className={`mr-2 size-2 rounded-full ${
                          cert.status === 'Active'
                            ? 'bg-green-500'
                            : cert.status === 'Inactive'
                              ? 'bg-gray-400'
                              : 'bg-blue-500'
                        }`}
                      />
                      {cert.status}
                    </div>
                  </TableCell>
                  <TableCell>{cert.issuedCount}</TableCell>
                  <TableCell>{formatDate(cert.created)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Certification</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Delete Certification</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
