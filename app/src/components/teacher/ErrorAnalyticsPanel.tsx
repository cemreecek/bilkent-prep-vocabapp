'use client'

import React, { useCallback, useEffect, useState } from 'react'
import type { ActionItem, ClassroomAnalyticsData, TopErrorItem } from '@/lib/teacherAnalytics'

interface ErrorAnalyticsPanelProps {
  classroomId: string
  initialTopErrors: TopErrorItem[]
  initialActionItems: ActionItem[]
}

const REFRESH_MS = 15000

export default function ErrorAnalyticsPanel({
  classroomId,
  initialTopErrors,
  initialActionItems,
}: ErrorAnalyticsPanelProps) {
  const [topErrors, setTopErrors] = useState<TopErrorItem[]>(initialTopErrors)
  const [actionItems, setActionItems] = useState<ActionItem[]>(initialActionItems)
  const [loading, setLoading] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date())
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setTopErrors(initialTopErrors)
    setActionItems(initialActionItems)
    setUpdatedAt(new Date())
  }, [classroomId, initialTopErrors, initialActionItems])

  const refresh = useCallback(async () => {
    if (!classroomId || classroomId === 'none') return
    setLoading(true)
    try {
      const res = await fetch(`/api/teacher/analytics?classroomId=${encodeURIComponent(classroomId)}`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(String(res.status))
      const data: ClassroomAnalyticsData = await res.json()
      setTopErrors(data.topErrors || [])
      setActionItems(data.actionItems || [])
      setUpdatedAt(data.updatedAt ? new Date(data.updatedAt) : new Date())
      setFailed(false)
    } catch (e) {
      console.error('Failed to refresh teacher analytics', e)
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [classroomId])

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, REFRESH_MS)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  const toneStyles = (tone: ActionItem['tone']) => {
    if (tone === 'error') {
      return 'bg-[color:var(--color-error-container)] text-[color:var(--color-on-error-container)] border-[color:var(--color-error)]/20'
    }
    if (tone === 'warning') {
      return 'bg-amber-50 text-amber-900 border-amber-300'
    }
    if (tone === 'success') {
      return 'bg-green-50 text-green-900 border-green-300'
    }
    return 'bg-[color:var(--color-primary-container)]/40 text-[color:var(--color-on-surface)] border-[color:var(--color-outline-variant)]'
  }

  return (
    <section className="h-full bg-[color:var(--color-surface-container-lowest)] rounded-xl border border-[color:var(--color-outline-variant)] overflow-hidden flex flex-col">
      <div className="p-5 border-b border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-container-low)] flex items-center justify-between gap-2">
        <h3 className="font-[family-name:var(--font-title-md)] text-[length:var(--text-title-md)] text-[color:var(--color-primary)] flex items-center">
          <span className="material-symbols-outlined mr-2 text-[color:var(--color-error)]">analytics</span>
          Error Analytics
        </h3>
        <div className="flex items-center gap-3 text-xs text-[color:var(--color-on-surface-variant)]">
          <span className="flex items-center gap-1.5" suppressHydrationWarning>
            <span className={`inline-block w-2 h-2 rounded-full ${failed ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
            {failed ? 'Retrying' : 'Live'} ·{' '}
            {updatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1 text-xs font-bold text-[color:var(--color-primary)] hover:underline disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Refresh
          </button>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        {/* Most Missed Concepts */}
        <div>
          <p className="font-[family-name:var(--font-label-sm)] text-xs font-bold uppercase tracking-wider text-[color:var(--color-on-surface-variant)] mb-3">
            Most Missed Concepts
          </p>
          <div className="space-y-3">
            {topErrors.length > 0 ? (
              topErrors.map((err, index) => {
                const maxCount = topErrors[0].count || 1
                const percentage = Math.max(12, (err.count / maxCount) * 100)
                const colors = [
                  { bg: 'bg-[color:var(--color-error)]', text: 'text-[color:var(--color-error)]' },
                  { bg: 'bg-amber-600', text: 'text-amber-700' },
                  { bg: 'bg-[color:var(--color-secondary)]', text: 'text-[color:var(--color-secondary)]' },
                ]
                const c = colors[index % colors.length]
                return (
                  <div key={`${err.word}-${index}`} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm gap-2">
                      <span className="font-bold text-[color:var(--color-on-surface)] truncate" title={err.word}>
                        &ldquo;{err.word}&rdquo;
                        {err.category && err.category !== 'vocab' && (
                          <span className="ml-1.5 text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[color:var(--color-surface-container-high)] text-[color:var(--color-on-surface-variant)]">
                            {err.category}
                          </span>
                        )}
                      </span>
                      <span className={`${c.text} font-bold text-xs shrink-0`}>
                        {err.count} Mistake{err.count > 1 ? 's' : ''}{' '}
                        {err.studentCount ? `(${err.studentCount} std)` : ''}
                      </span>
                    </div>
                    <div className="w-full bg-[color:var(--color-surface-container)] h-2 rounded-full overflow-hidden">
                      <div className={`${c.bg} h-full transition-all`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-[color:var(--color-on-surface-variant)] italic py-4">
                No active student errors recorded in this class right now.
              </p>
            )}
          </div>
        </div>

        {/* Real-Time Action Items */}
        <div className="flex flex-col">
          <p className="font-[family-name:var(--font-label-sm)] text-xs font-bold uppercase tracking-wider text-[color:var(--color-on-surface-variant)] mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[color:var(--color-primary)]">lightbulb</span>
            Real-Time Action Items
          </p>
          <div className="space-y-2.5 flex-1">
            {actionItems.map((item) => (
              <div key={item.id} className={`p-3.5 rounded-xl border ${toneStyles(item.tone)}`}>
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">{item.icon}</span>
                  <span>{item.title}</span>
                </p>
                <p className="text-xs opacity-90 mt-1 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
