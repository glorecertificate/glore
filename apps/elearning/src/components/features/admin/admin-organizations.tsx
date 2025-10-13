import { useState } from 'react'

import { Building2, Download, Filter, MoreHorizontal, Search } from 'lucide-react'

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
    id: '1',
    name: 'Community Helpers Association',
    type: 'Non-profit',
    status: 'Verified',
    region: 'North America',
    members: 42,
    created: '2022-03-15',
  },
  {
    id: '2',
    name: 'Urban Outreach Initiative',
    type: 'NGO',
    status: 'Verified',
    region: 'Europe',
    members: 28,
    created: '2022-05-22',
  },
  {
    id: '3',
    name: 'Volunteer Leaders Network',
    type: 'Non-profit',
    status: 'Pending',
    region: 'Asia',
    members: 15,
    created: '2022-07-08',
  },
  {
    id: '4',
    name: 'Global Volunteer Alliance',
    type: 'International',
    status: 'Verified',
    region: 'Global',
    members: 156,
    created: '2021-11-30',
  },
  {
    id: '5',
    name: 'Local Impact Group',
    type: 'Community',
    status: 'Verified',
    region: 'North America',
    members: 34,
    created: '2023-01-12',
  },
  {
    id: '6',
    name: 'Youth Empowerment Coalition',
    type: 'Non-profit',
    status: 'Suspended',
    region: 'Africa',
    members: 19,
    created: '2022-09-05',
  },
  {
    id: '7',
    name: 'Environmental Action Team',
    type: 'NGO',
    status: 'Verified',
    region: 'South America',
    members: 27,
    created: '2022-12-18',
  },
  {
    id: '8',
    name: 'Disaster Relief Network',
    type: 'International',
    status: 'Pending',
    region: 'Global',
    members: 89,
    created: '2023-02-28',
  },
]

export const AdminOrganizations = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string | undefined>()
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>()
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>()

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = !selectedType || org.type === selectedType
    const matchesStatus = !selectedStatus || org.status === selectedStatus
    const matchesRegion = !selectedRegion || org.region === selectedRegion

    return matchesSearch && matchesType && matchesStatus && matchesRegion
  })

  const clearFilters = () => {
    setSelectedType(undefined)
    setSelectedStatus(undefined)
    setSelectedRegion(undefined)
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
        <h2 className="font-bold text-3xl tracking-tight">{'Organizations Management'}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 size-4" />
            {'Export'}
          </Button>
          <Button>
            <Building2 className="mr-2 size-4" />
            {'Add Organization'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            className="w-full pl-9"
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search organizations..."
            type="search"
            value={searchTerm}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Filter className="mr-2 size-4" />
                {'Type'}
                {selectedType && <span className="ml-1 size-2 rounded-full bg-brand-secondary" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{'Filter by Type'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedType('Non-profit')}>{'Non-profit'}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedType('NGO')}>{'NGO'}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedType('International')}>{'International'}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedType('Community')}>{'Community'}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Filter className="mr-2 size-4" />
                {'Status'}
                {selectedStatus && <span className="ml-1 size-2 rounded-full bg-brand-secondary" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{'Filter by Status'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedStatus('Verified')}>{'Verified'}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('Pending')}>{'Pending'}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('Suspended')}>{'Suspended'}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Filter className="mr-2 size-4" />
                {'Region'}
                {selectedRegion && <span className="ml-1 size-2 rounded-full bg-brand-secondary" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{'Filter by Region'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedRegion('North America')}>{'North America'}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedRegion('Europe')}>{'Europe'}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedRegion('Asia')}>{'Asia'}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedRegion('South America')}>{'South America'}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedRegion('Africa')}>{'Africa'}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedRegion('Global')}>{'Global'}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {(selectedType || selectedStatus || selectedRegion) && (
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
              <TableHead>{'Name'}</TableHead>
              <TableHead>{'Type'}</TableHead>
              <TableHead>{'Status'}</TableHead>
              <TableHead>{'Region'}</TableHead>
              <TableHead>{'Members'}</TableHead>
              <TableHead>{'Created'}</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrganizations.length === 0 ? (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={8}>
                  {'No organizations found.'}
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
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>{'View Details'}</DropdownMenuItem>
                        <DropdownMenuItem>{'Edit Organization'}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">{'Delete Organization'}</DropdownMenuItem>
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
