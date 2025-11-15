import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, XCircle } from 'lucide-react'

export interface TimelineEvent {
  id: string
  title: string
  description?: string
  timestamp: string
  user?: {
    name: string
    role?: string
  }
  status?: 'completed' | 'current' | 'pending' | 'rejected'
  metadata?: Record<string, any>
}

interface TimelineProps {
  events: TimelineEvent[]
  className?: string
}

export function Timeline({ events, className }: TimelineProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {events.map((event, idx) => {
        const isLast = idx === events.length - 1
        const Icon = 
          event.status === 'completed' ? CheckCircle2 :
          event.status === 'rejected' ? XCircle :
          Circle
        
        const iconColor =
          event.status === 'completed' ? 'text-[#10B981]' :
          event.status === 'rejected' ? 'text-[#EF4444]' :
          event.status === 'current' ? 'text-[#4F46E5]' :
          'text-muted-foreground'
        
        return (
          <div key={event.id} className="relative flex gap-4">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[11px] top-8 h-full w-0.5 bg-border" />
            )}
            
            {/* Icon */}
            <div className={cn('relative z-10 mt-1', iconColor)}>
              <Icon className="h-6 w-6" />
            </div>
            
            {/* Content */}
            <div className="flex-1 pb-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{event.title}</h4>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.description}
                    </p>
                  )}
                  {event.user && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {event.user.name}
                      {event.user.role && ` • ${event.user.role}`}
                    </p>
                  )}
                </div>
                <time className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(event.timestamp).toLocaleString()}
                </time>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

