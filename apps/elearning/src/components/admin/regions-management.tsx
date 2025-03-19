import { useState } from 'react'

import { Download, Filter, Globe, MoreHorizontal, Search } from 'lucide-react'

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

const regions = [
  { id: '1', name: 'North America', countries: 3, organizations: 28, users: 456, status: 'Active' },
  { id: '2', name: 'Europe', countries: 27, organizations: 42, users: 678, status: 'Active' },
  { id: '3', name: 'Asia', countries: 15, organizations: 31, users: 542, status: 'Active' },
  { id: '4', name: 'South America', countries: 12, organizations: 19, users: 324, status: 'Active' },
  { id: '5', name: 'Africa', countries: 18, organizations: 23, users: 287, status: 'Active' },
  { id: '6', name: 'Oceania', countries: 4, organizations: 12, users: 156, status: 'Active' },
  { id: '7', name: 'Middle East', countries: 8, organizations: 15, users: 203, status: 'Inactive' },
  { id: '8', name: 'Caribbean', countries: 6, organizations: 8, users: 98, status: 'Inactive' },
]

export const RegionsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>()

  const filteredRegions = regions.filter(region => {
    const matchesSearch = region.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !selectedStatus || region.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const clearFilters = () => {
    setSelectedStatus(undefined)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{'Regions Management'}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {'Export'}
          </Button>
          <Button>
            <Globe className="mr-2 h-4 w-4" />
            {'Add Region'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="w-full pl-9"
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search regions..."
            type="search"
            value={searchTerm}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                {'Status'}
                {selectedStatus && <span className="ml-1 h-2 w-2 rounded-full bg-primary"></span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{'Filter by Status'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedStatus('Active')}>{'Active'}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('Inactive')}>{'Inactive'}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedStatus && (
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
              <TableHead>{'Countries'}</TableHead>
              <TableHead>{'Organizations'}</TableHead>
              <TableHead>{'Users'}</TableHead>
              <TableHead>{'Status'}</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRegions.length === 0 ? (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={7}>
                  {'No regions found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredRegions.map(region => (
                <TableRow key={region.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium">{region.name}</TableCell>
                  <TableCell>{region.countries}</TableCell>
                  <TableCell>{region.organizations}</TableCell>
                  <TableCell>{region.users}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div
                        className={`mr-2 h-2 w-2 rounded-full ${region.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}
                      />
                      {region.status}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>{'View Details'}</DropdownMenuItem>
                        <DropdownMenuItem>{'Edit Region'}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">{'Delete Region'}</DropdownMenuItem>
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
