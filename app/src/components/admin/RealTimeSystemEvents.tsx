'use client'

import React, { useCallback, useEffect, useState } from 'react'

type FeedEvent = {
  id: string
  title: string
  description?: string | null
  type: string
  icon?: string
  createdAt?: string
  timeAgo: string
}

const REFRESH_MS = 15000

export default function RealTimeSystemEvents({ initialEvents }: { initialEvents: FeedEvent[] }) {
  const [events, setEvents] = useState<FeedEvent[]>(initialEvents)
  const [loading, setLoading] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date())
  const [failed, setFailed] = useState(false)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/events', { cache: 'no-store' })
      if (!res.ok) throw new Error(String(res.status))
      setEvents(await res.json())
      setUpdatedAt(new Date())
      setFailed(false)
    } catch (e) {
      console.error('Failed to fetch real-time events', e)
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchEvents()
    }, REFRESH_MS)
    const onFocus = () => fetchEvents()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [fetchEvents])

  const tone = (type: string) =>
    type === 'WARNING' || type === 'ERROR'
      ? 'bg-[color:var(--color-error)]/10 text-[color:var(--color-error)]'
      : type === 'SUCCESS'
        ? 'bg-[color:var(--color-secondary-container)]/20 text-[color:var(--color-secondary)]'
        : 'bg-[color:var(--color-primary-container)]/20 text-[color:var(--color-primary)]'

  const iconFor = (e: FeedEvent) =>
    e.icon || (e.type === 'WARNING' || e.type === 'ERROR' ? 'warning' : e.type === 'SUCCESS' ? 'check_circle' : 'info')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-[color:var(--color-on-surface-variant)]">
        <span className="flex items-center gap-1.5" suppressHydrationWarning>
          <span className={`inline-block w-2 h-2 rounded-full ${failed ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
          {failed ? 'Connection lost, retrying' : 'Live'} · updated {updatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <button
          onClick={fetchEvents}
          disabled={loading}
          className="flex items-center gap-1 text-sm text-[color:var(--color-primary)] hover:underline disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
          Refresh
        </button>
      </div>

      {events.length > 0 ? (
        events.map(event => (
          <div key={event.id} className="flex items-start gap-4 p-3 hover:bg-[color:var(--color-surface)] transition-colors rounded-lg">
            <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${tone(event.type)}`}>
              <span className="material-symbols-outlined text-sm">{iconFor(event)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[color:var(--color-on-surface)]" dangerouslySetInnerHTML={{ __html: event.title }} />
              {event.description && <p className="text-xs text-[color:var(--color-on-surface-variant)] mt-1">{event.description}</p>}
              <p className="text-xs text-[color:var(--color-on-surface-variant)] mt-1" title={event.createdAt ? new Date(event.createdAt).toLocaleString('en-GB', { timeZone: 'Europe/Istanbul' }) : undefined}>
                {event.timeAgo}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-center py-6 text-[color:var(--color-on-surface-variant)]">No activity yet.</p>
      )}
    </div>
  )
}
