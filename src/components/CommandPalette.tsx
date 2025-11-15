import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Command } from 'cmdk'
import {
  Building2,
  FileText,
  Users,
  Clock,
  Award,
  MessageSquare,
  CheckSquare,
  ClipboardCheck,
  Briefcase,
  BarChart3,
  Shield,
  Settings,
  Search,
} from 'lucide-react'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])
  
  const handleSelect = (path: string) => {
    navigate({ to: path as any })
    onOpenChange(false)
    setSearch('')
  }
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="fixed left-1/2 top-1/4 -translate-x-1/2 w-full max-w-2xl">
        <Command
          className="rounded-lg border bg-background shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            
            <Command.Group heading="Navigation" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
              <Command.Item
                onSelect={() => handleSelect('/')}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </Command.Item>
              
              <Command.Item
                onSelect={() => handleSelect('/organizations')}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <Building2 className="h-4 w-4" />
                <span>Organizations</span>
              </Command.Item>
              
              <Command.Item
                onSelect={() => handleSelect('/departments')}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <Users className="h-4 w-4" />
                <span>Departments</span>
              </Command.Item>
              
              <Command.Item
                onSelect={() => handleSelect('/documents')}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <FileText className="h-4 w-4" />
                <span>Documents</span>
              </Command.Item>
              
              <Command.Item
                onSelect={() => handleSelect('/attendance')}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <Clock className="h-4 w-4" />
                <span>Attendance</span>
              </Command.Item>
              
              <Command.Item
                onSelect={() => handleSelect('/certifications')}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <Award className="h-4 w-4" />
                <span>Certifications</span>
              </Command.Item>
              
              <Command.Item
                onSelect={() => handleSelect('/messages')}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Messages</span>
              </Command.Item>
              
              <Command.Item
                onSelect={() => handleSelect('/tasks')}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Tasks</span>
              </Command.Item>
              
              <Command.Item
                onSelect={() => handleSelect('/inspections')}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <ClipboardCheck className="h-4 w-4" />
                <span>Inspections</span>
              </Command.Item>
              
              <Command.Item
                onSelect={() => handleSelect('/stakeholders')}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <Briefcase className="h-4 w-4" />
                <span>Stakeholders</span>
              </Command.Item>
              
              <Command.Item
                onSelect={() => handleSelect('/reports')}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Reports</span>
              </Command.Item>
            </Command.Group>
            
            <Command.Separator className="my-1 h-px bg-border" />
            
            <Command.Group heading="Special Roles" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
              <Command.Item
                onSelect={() => handleSelect('/rgm')}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <Shield className="h-4 w-4" />
                <span>RGM Dashboard</span>
              </Command.Item>
              
              <Command.Item
                onSelect={() => handleSelect('/security')}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <Shield className="h-4 w-4" />
                <span>Security (ACOS)</span>
              </Command.Item>
              
              <Command.Item
                onSelect={() => handleSelect('/admin')}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <Settings className="h-4 w-4" />
                <span>Admin Dashboard</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
          
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd> to toggle
          </div>
        </Command>
      </div>
    </div>
  )
}

