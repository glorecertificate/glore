import { useState } from 'react'

import { DownloadIcon, FilterIcon, MoreHorizontalIcon, SearchIcon, UserPlusIcon } from 'lucide-react'

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
    email: 'john@example.com',
    id: '1',
    joined: '2023-05-12',
    name: 'John Doe',
    region: 'North America',
    role: 'Volunteer',
    status: 'Active',
  },
  {
    email: 'jane@example.com',
    id: '2',
    joined: '2023-06-18',
    name: 'Jane Smith',
    region: 'Europe',
    role: 'Organization Admin',
    status: 'Active',
  },
  {
    email: 'robert@example.com',
    id: '3',
    joined: '2023-04-22',
    name: 'Robert Johnson',
    region: 'Asia',
    role: 'Volunteer',
    status: 'Inactive',
  },
  {
    email: 'emily@example.com',
    id: '4',
    joined: '2023-07-30',
    name: 'Emily Davis',
    region: 'North America',
    role: 'Admin',
    status: 'Active',
  },
  {
    email: 'michael@example.com',
    id: '5',
    joined: '2023-08-05',
    name: 'Michael Wilson',
    region: 'South America',
    role: 'Volunteer',
    status: 'Active',
  },
  {
    email: 'sarah@example.com',
    id: '6',
    joined: '2023-09-14',
    name: 'Sarah Brown',
    region: 'Europe',
    role: 'Organization Admin',
    status: 'Active',
  },
  {
    email: 'david@example.com',
    id: '7',
    joined: '2023-10-02',
    name: 'David Miller',
    region: 'Africa',
    role: 'Volunteer',
    status: 'Pending',
  },
  {
    email: 'lisa@example.com',
    id: '8',
    joined: '2023-11-19',
    name: 'Lisa Taylor',
    region: 'Oceania',
    role: 'Volunteer',
    status: 'Active',
  },
]

export const AdminUsers = () => {
  const [searchTerm, setSearchIconTerm] = useState('')
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | undefined>()
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>()
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>()

  const filteredUsers = users.filter(user => {
    const matchesSearchIcon =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = !selectedRole || user.role === selectedRole
    const matchesStatus = !selectedStatus || user.status === selectedStatus
    const matchesRegion = !selectedRegion || user.region === selectedRegion

    return matchesSearchIcon && matchesRole && matchesStatus && matchesRegion
  })

  const clearFilterIcons = () => {
    setSelectedRole(undefined)
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
        <h2 className="text-3xl font-bold tracking-tight">Users Management</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <DownloadIcon className="mr-2 size-4" />
            Export
          </Button>
          <Button onClick={() => setIsAddUserOpen(true)}>
            <UserPlusIcon className="mr-2 size-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-96">
          <SearchIcon className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            className="w-full pl-9"
            onChange={e => setSearchIconTerm(e.target.value)}
            placeholder="SearchIcon users..."
            type="search"
            value={searchTerm}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <FilterIcon className="mr-2 size-4" />
                Role
                {selectedRole && <span className="ml-1 size-2 rounded-full bg-brand-secondary" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>FilterIcon by Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedRole('Admin')}>Admin</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedRole('Volunteer')}>Volunteer</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedRole('Organization Admin')}>
                Organization Admin
              </DropdownMenuItem>
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
              <DropdownMenuItem onClick={() => setSelectedStatus('Pending')}>Pending</DropdownMenuItem>
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
              <DropdownMenuItem onClick={() => setSelectedRegion('Oceania')}>Oceania</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {(selectedRole || selectedStatus || selectedRegion) && (
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
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={8}>
                  No users found.
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
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit User</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Delete User</DropdownMenuItem>
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
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. The user will receive an email to set their password.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <Input id="first-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input id="last-name" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="organization-admin">Organization Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select>
                <SelectTrigger id="region">
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="north-america">North America</SelectItem>
                  <SelectItem value="europe">Europe</SelectItem>
                  <SelectItem value="asia">Asia</SelectItem>
                  <SelectItem value="south-america">South America</SelectItem>
                  <SelectItem value="africa">Africa</SelectItem>
                  <SelectItem value="oceania">Oceania</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="send-email" />
              <Label htmlFor="send-email">Send welcome email</Label>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsAddUserOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button type="submit">Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
