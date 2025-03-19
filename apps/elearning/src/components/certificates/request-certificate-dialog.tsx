'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface RequestCertificateDialogProps {
  onOpenChange: (open: boolean) => void
  open: boolean
}

const completedModules = [
  { id: '1', title: 'Introduction to Volunteering' },
  { id: '2', title: 'Community Engagement' },
  { id: '4', title: 'Leadership in Volunteer Organizations' },
]

const organizations = [
  { id: '1', name: 'Community Helpers Association' },
  { id: '2', name: 'Urban Outreach Initiative' },
  { id: '3', name: 'Volunteer Leaders Network' },
  { id: '4', name: 'Global Volunteer Alliance' },
]

export const RequestCertificateDialog = ({ onOpenChange, open }: RequestCertificateDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{'Request a Certificate'}</DialogTitle>
          <DialogDescription>{'Fill out the form below to request a certificate for your completed module.'}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4 py-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="module">{'Completed Module'}</Label>
            <Select required>
              <SelectTrigger id="module">
                <SelectValue placeholder="Select a module" />
              </SelectTrigger>
              <SelectContent>
                {completedModules.map(module => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">{'Organization'}</Label>
            <Select required>
              <SelectTrigger id="organization">
                <SelectValue placeholder="Select an organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">{'Your Role'}</Label>
            <Input id="role" placeholder="e.g., Volunteer Coordinator" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">{'Volunteer Hours'}</Label>
            <Input id="hours" min="1" placeholder="e.g., 20" required type="number" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{'Description of Activities'}</Label>
            <Textarea
              className="min-h-[100px]"
              id="description"
              placeholder="Describe your volunteer activities and how you applied the skills from the module"
              required
            />
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              {'Cancel'}
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
