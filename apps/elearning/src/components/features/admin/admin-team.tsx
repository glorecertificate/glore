'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { Download, Filter, MoreHorizontal, Search, UserPlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Loader } from '@/components/icons/loader'
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
import { getTeamMembers, type User } from '@/lib/data'

export const AdminTeam = () => {
  const t = useTranslations('Admin.team')
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | undefined>()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor'>('editor')
  const [submitting, setSubmitting] = useState(false)

  const loadTeamMembers = useCallback(async () => {
    const users = await getTeamMembers()
    setUsers(users)
    setLoading(false)
  }, [])

  useEffect(() => void loadTeamMembers(), [loadTeamMembers])

  const inviteTeamMember = useCallback(async (email: string, role: 'admin' | 'editor') => {
    const response = await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        role,
        redirectTo: `${window.location.origin}/welcome`,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to invite user')
    }

    const data = await response.json()
    return data.user
  }, [])

  const filteredUsers = useMemo(
    () =>
      users.filter(user => {
        const matchesSearch =
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())

        const userRole = user.isAdmin ? 'admin' : user.isEditor ? 'editor' : null
        const matchesRole = !selectedRole || userRole === selectedRole

        return matchesSearch && matchesRole
      }),
    [users, searchTerm, selectedRole]
  )

  const clearFilters = useCallback(() => {
    setSelectedRole(undefined)
  }, [])

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }, [])

  const getDisplayName = useCallback((user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    if (user.firstName) return user.firstName
    if (user.username) return `@${user.username}`
    return user.email
  }, [])

  const getRoleLabel = useCallback(
    (user: User) => {
      if (user.isAdmin) return t('roleAdmin')
      if (user.isEditor) return t('roleEditor')
      return t('roleUser')
    },
    [t]
  )

  const handleInviteUser = useCallback(async () => {
    if (!inviteEmail) {
      toast.error(t('errorInvalidInput'))
      return
    }

    if (!inviteRole) {
      toast.error(t('errorInvalidInput'))
      return
    }

    try {
      setSubmitting(true)
      await inviteTeamMember(inviteEmail, inviteRole)
      toast.success(t('inviteSuccess'))
      setIsAddUserOpen(false)
      setInviteEmail('')
      setInviteRole('editor')
      await loadTeamMembers()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : t('errorInviting'))
    } finally {
      setSubmitting(false)
    }
  }, [inviteEmail, inviteTeamMember, inviteRole, loadTeamMembers, t])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-3xl tracking-tight">{t('title')}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 size-4" />
            {t('export')}
          </Button>
          <Button onClick={() => setIsAddUserOpen(true)} variant="brand">
            <UserPlus className="mr-2 size-4" />
            {t('addUser')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            className="w-full pl-9"
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('searchPlaceholder')}
            type="search"
            value={searchTerm}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Filter className="mr-2 size-4" />
                {t('filterRole')}
                {selectedRole && <span className="ml-1 size-2 rounded-full bg-brand-secondary" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{t('filterByRole')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedRole('admin')}>{t('roleAdmin')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedRole('editor')}>{t('roleEditor')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedRole && (
            <Button onClick={clearFilters} size="sm" variant="ghost">
              {t('clearFilters')}
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
              <TableHead>{t('tableHeaderName')}</TableHead>
              <TableHead>{t('tableHeaderEmail')}</TableHead>
              <TableHead>{t('tableHeaderRole')}</TableHead>
              <TableHead>{t('tableHeaderJoined')}</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={6}>
                  <Loader className="size-4" />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={6}>
                  {t('noUsers')}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium">{getDisplayName(user)}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleLabel(user)}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>{t('viewDetails')}</DropdownMenuItem>
                        <DropdownMenuItem>{t('editUser')}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">{t('deleteUser')}</DropdownMenuItem>
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
            <DialogTitle>{t('dialogTitle')}</DialogTitle>
            <DialogDescription>{t('dialogDescription')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input
                disabled={submitting}
                id="email"
                onChange={e => setInviteEmail(e.target.value)}
                type="email"
                value={inviteEmail}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t('roleLabel')}</Label>
              <Select
                disabled={submitting}
                onValueChange={value => setInviteRole(value as 'admin' | 'editor')}
                value={inviteRole}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder={t('selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t('roleAdmin')}</SelectItem>
                  <SelectItem value="editor">{t('roleEditor')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button disabled={submitting} onClick={() => setIsAddUserOpen(false)} variant="outline">
              {t('cancel')}
            </Button>
            <Button disabled={submitting} onClick={handleInviteUser} type="submit" variant="brand">
              {submitting ? t('inviting') : t('inviteUser')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
