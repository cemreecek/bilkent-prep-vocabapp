'use client'

import React, { useEffect, useState } from 'react'

export default function RealTimeSystemEvents({ initialEvents }: { initialEvents: any[] }) {
  const [events, setEvents] = useState(initialEvents)

  useEffect(() => {
    // Poll for events every 10 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/events')
        if (res.ok) {
          const data = await res.json()
          setEvents(data)
        }
      } catch (e) {
        console.error('Failed to fetch real-time events', e)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const hasLiveEvents = events.length > 0

  return (
    <div className="space-y-4">
      {hasLiveEvents ? (
        events.map(event => (
          <div key={event.id} className="flex items-start gap-4 p-3 hover:bg-[color:var(--color-surface)] transition-colors rounded-lg">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              event.type === 'WARNING' || event.type === 'ERROR' ? 'bg-[color:var(--color-error)]/10 text-[color:var(--color-error)]' : 
              event.type === 'SUCCESS' ? 'bg-[color:var(--color-secondary-container)]/20 text-[color:var(--color-secondary)]' : 
              'bg-[color:var(--color-primary-container)]/20 text-[color:var(--color-primary)]'
            }`}>
              <span className="material-symbols-outlined text-sm">
                {event.type === 'WARNING' || event.type === 'ERROR' ? 'warning' :
                 event.type === 'SUCCESS' ? 'check_circle' : 'info'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-[color:var(--color-on-surface)]" dangerouslySetInnerHTML={{ __html: event.title }}></p>
              {event.description && <p className="text-xs text-[color:var(--color-on-surface-variant)] mt-1">{event.description}</p>}
              <p className="text-xs text-[color:var(--color-on-surface-variant)] mt-1">{event.timeAgo} • System</p>
            </div>
          </div>
        ))
      ) : (
        <>
          <div className="flex items-start gap-4 p-3 hover:bg-[color:var(--color-surface)] transition-colors rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[color:var(--color-primary-container)]/20 flex items-center justify-center text-[color:var(--color-primary)]">
              <span className="material-symbols-outlined text-sm">edit</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-[color:var(--color-on-surface)]">
                Curriculum update pushed to <strong>Section 101, 102</strong>
              </p>
              <p className="text-xs text-[color:var(--color-on-surface-variant)]">12 minutes ago • System Admin</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-3 hover:bg-[color:var(--color-surface)] transition-colors rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[color:var(--color-secondary-container)]/20 flex items-center justify-center text-[color:var(--color-secondary)]">
              <span className="material-symbols-outlined text-sm">person_add</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-[color:var(--color-on-surface)]">
                <strong>Prof. Selin Yılmaz</strong> assigned to Section 102
              </p>
              <p className="text-xs text-[color:var(--color-on-surface-variant)]">2 hours ago • HR Module</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-3 hover:bg-[color:var(--color-surface)] transition-colors rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[color:var(--color-error)]/10 flex items-center justify-center text-[color:var(--color-error)]">
              <span className="material-symbols-outlined text-sm">warning</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-[color:var(--color-on-surface)]">
                Critical Drop-off detected in <strong>Section 204</strong> participation
              </p>
              <p className="text-xs text-[color:var(--color-on-surface-variant)]">5 hours ago • Analytics Bot</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
