import { Bell, Search, Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const AdminHeader = () => (
  <header className="border-b bg-background">
    <div className="container py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{'Admin Dashboard'}</h1>

        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="w-full pl-9" placeholder="Search..." type="search" />
          </div>

          <Button size="icon" variant="outline">
            <Bell className="h-4 w-4" />
          </Button>

          <Button size="icon" variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </header>
)
