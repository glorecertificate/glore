import { useState } from 'react'

import { Building2Icon, DownloadIcon, FilterIcon, MoreHorizontalIcon, SearchIcon } from 'lucide-react'

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

const organizations = [
  {
    created: '2022-03-15',
    id: '1',
    members: 42,
    name: 'Community Helpers Association',
    region: 'North America',
    status: 'Verified',
    type: 'Non-profit',
  },
  {
    created: '2022-05-22',
    id: '2',
    members: 28,
    name: 'Urban Outreach Initiative',
    region: 'Europe',
    status: 'Verified',
    type: 'NGO',
  },
  {
    created: '2022-07-08',
    id: '3',
    members: 15,
    name: 'Volunteer Leaders Network',
    region: 'Asia',
    status: 'Pending',
    type: 'Non-profit',
  },
  {
    created: '2021-11-30',
    id: '4',
    members: 156,
    name: 'Global Volunteer Alliance',
    region: 'Global',
    status: 'Verified',
    type: 'International',
  },
  {
    created: '2023-01-12',
    id: '5',
    members: 34,
    name: 'Local Impact Group',
    region: 'North America',
    status: 'Verified',
    type: 'Community',
  },
  {
    created: '2022-09-05',
    id: '6',
    members: 19,
    name: 'Youth Empowerment Coalition',
    region: 'Africa',
    status: 'Suspended',
    type: 'Non-profit',
  },
  {
    created: '2022-12-18',
    id: '7',
    members: 27,
    name: 'Environmental Action Team',
    region: 'South America',
    status: 'Verified',
    type: 'NGO',
  },
  {
    created: '2023-02-28',
    id: '8',
    members: 89,
    name: 'Disaster Relief Network',
    region: 'Global',
    status: 'Pending',
    type: 'International',
  },
]

export const AdminOrganizations = () => {
  const [searchTerm, setSearchIconTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string | undefined>()
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>()
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>()

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearchIcon = org.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = !selectedType || org.type === selectedType
    const matchesStatus = !selectedStatus || org.status === selectedStatus
    const matchesRegion = !selectedRegion || org.region === selectedRegion

    return matchesSearchIcon && matchesType && matchesStatus && matchesRegion
  })

  const clearFilterIcons = () => {
    setSelectedType(undefined)
    setSelectedStatus(undefined)
    setSelectedRegion(undefined)
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
        <h2 className="text-3xl font-bold tracking-tight">Organizations Management</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <DownloadIcon className="mr-2 size-4" />
            Export
          </Button>
          <Button>
            <Building2Icon className="mr-2 size-4" />
            Add Organization
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-96">
          <SearchIcon className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            className="w-full pl-9"
            onChange={e => setSearchIconTerm(e.target.value)}
            placeholder="SearchIcon organizations..."
            type="search"
            value={searchTerm}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <FilterIcon className="mr-2 size-4" />
                Type
                {selectedType && <span className="ml-1 size-2 rounded-full bg-brand-secondary" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>FilterIcon by Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedType('Non-profit')}>Non-profit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedType('NGO')}>NGO</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedType('International')}>International</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedType('Community')}>Community</DropdownMenuItem>
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
              <DropdownMenuItem onClick={() => setSelectedStatus('Verified')}>Verified</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('Pending')}>Pending</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('Suspended')}>Suspended</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <FilterIcon className="mr-2 size-4" />
                Region
                {selectedRegion && <span className="ml-1 size-2 rounded-full bg-brand-secondary" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>FilterIcon by Region</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedRegion('North America')}>North America</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedRegion('Europe')}>Europe</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedRegion('Asia')}>Asia</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedRegion('South America')}>South America</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedRegion('Africa')}>Africa</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedRegion('Global')}>Global</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {(selectedType || selectedStatus || selectedRegion) && (
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
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrganizations.length === 0 ? (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={8}>
                  No organizations found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrganizations.map(org => (
                <TableRow key={org.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>{org.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div
                        className={`mr-2 size-2 rounded-full ${
                          org.status === 'Verified'
                            ? 'bg-green-500'
                            : org.status === 'Suspended'
                              ? 'bg-red-500'
                              : 'bg-amber-500'
                        }`}
                      />
                      {org.status}
                    </div>
                  </TableCell>
                  <TableCell>{org.region}</TableCell>
                  <TableCell>{org.members}</TableCell>
                  <TableCell>{formatDate(org.created)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Organization</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Delete Organization</DropdownMenuItem>
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
