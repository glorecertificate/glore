import { useState } from 'react'

import { Download, Filter, MoreHorizontal, Search, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const users = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Volunteer',
    status: 'Active',
    region: 'North America',
    joined: '2023-05-12',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Organization Admin',
    status: 'Active',
    region: 'Europe',
    joined: '2023-06-18',
  },
  {
    id: '3',
    name: 'Robert Johnson',
    email: 'robert@example.com',
    role: 'Volunteer',
    status: 'Inactive',
    region: 'Asia',
    joined: '2023-04-22',
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@example.com',
    role: 'Admin',
    status: 'Active',
    region: 'North America',
    joined: '2023-07-30',
  },
  {
    id: '5',
    name: 'Michael Wilson',
    email: 'michael@example.com',
    role: 'Volunteer',
    status: 'Active',
    region: 'South America',
    joined: '2023-08-05',
  },
  {
    id: '6',
    name: 'Sarah Brown',
    email: 'sarah@example.com',
    role: 'Organization Admin',
    status: 'Active',
    region: 'Europe',
    joined: '2023-09-14',
  },
  {
    id: '7',
    name: 'David Miller',
    email: 'david@example.com',
    role: 'Volunteer',
    status: 'Pending',
    region: 'Africa',
    joined: '2023-10-02',
  },
  {
    id: '8',
    name: 'Lisa Taylor',
    email: 'lisa@example.com',
    role: 'Volunteer',
    status: 'Active',
    region: 'Oceania',
    joined: '2023-11-19',
  },
]

export const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | undefined>()
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>()
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>()

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = !selectedRole || user.role === selectedRole
    const matchesStatus = !selectedStatus || user.status === selectedStatus
    const matchesRegion = !selectedRegion || user.region === selectedRegion

    return matchesSearch && matchesRole && matchesStatus && matchesRegion
  })

  const clearFilters = () => {
    setSelectedRole(undefined)
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
        <h2 className="text-3xl font-bold tracking-tight">{'Users Management'}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 size-4" />
            {'Export'}
          </Button>
          <Button onClick={() => setIsAddUserOpen(true)}>
            <UserPlus className="mr-2 size-4" />
            {'Add User'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            className="w-full pl-9"
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            type="search"
            value={searchTerm}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Filter className="mr-2 size-4" />
                {'Role'}
                {selectedRole && <span className="ml-1 size-2 rounded-full bg-brand-secondary"></span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{'Filter by Role'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedRole('Admin')}>{'Admin'}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedRole('Volunteer')}>{'Volunteer'}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedRole('Organization Admin')}>
                {'Organization Admin'}
              </DropdownMenuItem>
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
              <DropdownMenuItem onClick={() => setSelectedStatus('Pending')}>{'Pending'}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Filter className="mr-2 size-4" />
                {'Region'}
                {selectedRegion && <span className="ml-1 size-2 rounded-full bg-brand-secondary"></span>}
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
              <DropdownMenuItem onClick={() => setSelectedRegion('Oceania')}>{'Oceania'}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {(selectedRole || selectedStatus || selectedRegion) && (
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
              <TableHead>{'Email'}</TableHead>
              <TableHead>{'Role'}</TableHead>
              <TableHead>{'Status'}</TableHead>
              <TableHead>{'Region'}</TableHead>
              <TableHead>{'Joined'}</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={8}>
                  {'No users found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div
                        className={`mr-2 size-2 rounded-full ${
                          user.status === 'Active'
                            ? 'bg-green-500'
                            : user.status === 'Inactive'
                              ? 'bg-gray-400'
                              : 'bg-amber-500'
                        }`}
                      />
                      {user.status}
                    </div>
                  </TableCell>
                  <TableCell>{user.region}</TableCell>
                  <TableCell>{formatDate(user.joined)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>{'View Details'}</DropdownMenuItem>
                        <DropdownMenuItem>{'Edit User'}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">{'Delete User'}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog onOpenChange={setIsAddUserOpen} open={isAddUserOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{'Add New User'}</DialogTitle>
            <DialogDescription>
              {'Create a new user account. The user will receive an email to set their password.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">{'First name'}</Label>
                <Input id="first-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">{'Last name'}</Label>
                <Input id="last-name" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{'Email'}</Label>
              <Input id="email" type="email" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{'Role'}</Label>
              <Select>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{'Admin'}</SelectItem>
                  <SelectItem value="volunteer">{'Volunteer'}</SelectItem>
                  <SelectItem value="organization-admin">{'Organization Admin'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">{'Region'}</Label>
              <Select>
                <SelectTrigger id="region">
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="north-america">{'North America'}</SelectItem>
                  <SelectItem value="europe">{'Europe'}</SelectItem>
                  <SelectItem value="asia">{'Asia'}</SelectItem>
                  <SelectItem value="south-america">{'South America'}</SelectItem>
                  <SelectItem value="africa">{'Africa'}</SelectItem>
                  <SelectItem value="oceania">{'Oceania'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="send-email" />
              <Label htmlFor="send-email">{'Send welcome email'}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsAddUserOpen(false)} variant="outline">
              {'Cancel'}
            </Button>
            <Button type="submit">{'Create User'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
