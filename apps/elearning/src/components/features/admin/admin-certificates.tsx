import { useState } from 'react'

import { Award, Download, Filter, MoreHorizontal, Search } from 'lucide-react'

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
    id: '1',
    title: 'Introduction to Volunteering',
    organization: 'Community Helpers Association',
    status: 'Active',
    issuedCount: 156,
    created: '2022-04-10',
  },
  {
    id: '2',
    title: 'Community Engagement Specialist',
    organization: 'Urban Outreach Initiative',
    status: 'Active',
    issuedCount: 89,
    created: '2022-06-15',
  },
  {
    id: '3',
    title: 'Project Management for Volunteers',
    organization: 'Volunteer Leaders Network',
    status: 'Active',
    issuedCount: 112,
    created: '2022-08-22',
  },
  {
    id: '4',
    title: 'Leadership in Volunteer Organizations',
    organization: 'Global Volunteer Alliance',
    status: 'Active',
    issuedCount: 78,
    created: '2022-10-05',
  },
  {
    id: '5',
    title: 'Fundraising Fundamentals',
    organization: 'Local Impact Group',
    status: 'Inactive',
    issuedCount: 45,
    created: '2023-01-18',
  },
  {
    id: '6',
    title: 'Volunteer Coordination',
    organization: 'Youth Empowerment Coalition',
    status: 'Active',
    issuedCount: 67,
    created: '2023-03-09',
  },
  {
    id: '7',
    title: 'Crisis Response Training',
    organization: 'Disaster Relief Network',
    status: 'Active',
    issuedCount: 203,
    created: '2023-05-27',
  },
  {
    id: '8',
    title: 'Environmental Advocacy',
    organization: 'Environmental Action Team',
    status: 'Draft',
    issuedCount: 0,
    created: '2023-07-14',
  },
]

export const AdminCertificates = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrganization, setSelectedOrganization] = useState<string | undefined>()
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>()

  const filteredCertifications = certifications.filter(cert => {
    const matchesSearch = cert.title.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesOrganization = !selectedOrganization || cert.organization === selectedOrganization
    const matchesStatus = !selectedStatus || cert.status === selectedStatus

    return matchesSearch && matchesOrganization && matchesStatus
  })

  const clearFilters = () => {
    setSelectedOrganization(undefined)
    setSelectedStatus(undefined)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{'Certifications Management'}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 size-4" />
            {'Export'}
          </Button>
          <Button>
            <Award className="mr-2 size-4" />
            {'Add Certification'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            className="w-full pl-9"
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search certifications..."
            type="search"
            value={searchTerm}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Filter className="mr-2 size-4" />
                {'Organization'}
                {selectedOrganization && <span className="ml-1 size-2 rounded-full bg-brand-secondary"></span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{'Filter by Organization'}</DropdownMenuLabel>
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
                <Filter className="mr-2 size-4" />
                {'Status'}
                {selectedStatus && <span className="ml-1 size-2 rounded-full bg-brand-secondary"></span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{'Filter by Status'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedStatus('Active')}>{'Active'}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('Inactive')}>{'Inactive'}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('Draft')}>{'Draft'}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {(selectedOrganization || selectedStatus) && (
            <Button onClick={clearFilters} size="sm" variant="ghost">
              {'Clear Filters'}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox />
              </TableHead>
              <TableHead>{'Title'}</TableHead>
              <TableHead>{'Organization'}</TableHead>
              <TableHead>{'Status'}</TableHead>
              <TableHead>{'Issued'}</TableHead>
              <TableHead>{'Created'}</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCertifications.length === 0 ? (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={7}>
                  {'No certifications found.'}
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
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>{'View Details'}</DropdownMenuItem>
                        <DropdownMenuItem>{'Edit Certification'}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">{'Delete Certification'}</DropdownMenuItem>
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
