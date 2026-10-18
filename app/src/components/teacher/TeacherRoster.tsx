'use client'

import React, { useEffect, useMemo, useState } from 'react'
import EditStudentModal from './EditStudentModal'
import ResetPasswordButton from '../ResetPasswordButton'

interface RosterStudent {
  id: string
  name: string
  email?: string
  initials: string
  streak: number
  practicedToday?: boolean
  weekDays?: boolean[]
  weekCount?: number
  monthCount?: number
  debt: number
  openMistakes?: number
  points: number | string
  lastLogin: Date | string | null
  timeSpentHours: string
  timeSpentMinutes?: number
  sessionCount?: number
}

interface TeacherRosterProps {
  roster: RosterStudent[]
}

type SortKey = 'name' | 'streak' | 'frequency' | 'debt' | 'points'
type SortDir = 'asc' | 'desc'

export default function TeacherRoster({ roster: initialRoster }: TeacherRosterProps) {
  const [roster, setRoster] = useState<RosterStudent[]>(initialRoster)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('points')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [editingStudent, setEditingStudent] = useState<RosterStudent | null>(null)

  useEffect(() => {
    setRoster(initialRoster)
  }, [initialRoster])

  const hasLiveRoster = roster.length > 0

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const filteredAndSortedRoster = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const filtered = roster.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q))
    )

    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'streak') {
        cmp = (a.streak || 0) - (b.streak || 0)
      } else if (sortKey === 'frequency') {
        cmp =
          (a.weekCount || 0) - (b.weekCount || 0) ||
          (a.monthCount || 0) - (b.monthCount || 0)
      } else if (sortKey === 'debt') {
        cmp = (a.debt || 0) - (b.debt || 0)
      } else if (sortKey === 'points') {
        cmp =
          (parseFloat(String(a.points)) || 0) -
          (parseFloat(String(b.points)) || 0)
      } else {
        cmp = a.name.localeCompare(b.name)
      }
      if (cmp === 0) cmp = a.name.localeCompare(b.name)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [roster, searchQuery, sortKey, sortDir])

  const handleEditSuccess = async () => {
    window.location.reload()
  }

  const sortButtons: { key: SortKey; label: string; icon: string }[] = [
    { key: 'streak', label: 'Streak', icon: 'local_fire_department' },
    { key: 'frequency', label: 'Frequency', icon: 'calendar_month' },
    { key: 'debt', label: 'Debt Status', icon: 'warning' },
    { key: 'points', label: 'Weekly Points', icon: 'stars' },
  ]

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <span className="material-symbols-outlined text-[14px] opacity-40">unfold_more</span>
    }
    return (
      <span className="material-symbols-outlined text-[14px] text-[color:var(--color-primary)]">
        {sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'}
      </span>
    )
  }

  const formatTimeSpent = (s: RosterStudent) => {
    const mins = s.timeSpentMinutes ?? Math.round((parseFloat(s.timeSpentHours) || 0) * 60)
    if (mins >= 60) return `${s.timeSpentHours}h`
    return `${mins}m`
  }

  return (
    <section className="w-full bg-[color:var(--color-surface-container-lowest)] rounded-xl border border-[color:var(--color-outline-variant)] overflow-hidden shadow-sm">
      <div className="p-6 border-b border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-container-low)] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <h3 className="font-[family-name:var(--font-title-md)] text-[length:var(--text-title-md)] text-[color:var(--color-primary)] flex items-center">
            <span className="material-symbols-outlined mr-2">group</span>
            Student Roster
          </h3>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[color:var(--color-primary-container)] text-[color:var(--color-on-primary-container)]">
            {filteredAndSortedRoster.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          {/* Quick Sort Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-on-surface-variant)] mr-1">
              Sort by:
            </span>
            {sortButtons.map((btn) => {
              const active = sortKey === btn.key
              return (
                <button
                  key={btn.key}
                  type="button"
                  onClick={() => toggleSort(btn.key)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    active
                      ? 'bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] border-[color:var(--color-primary)] shadow-sm'
                      : 'bg-white text-[color:var(--color-on-surface)] border-[color:var(--color-outline-variant)] hover:border-[color:var(--color-primary)]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{btn.icon}</span>
                  <span>{btn.label}</span>
                  <span className="material-symbols-outlined text-[14px]">
                    {active ? (sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward') : 'unfold_more'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search Input */}
          <div className="flex items-center bg-white border border-[color:var(--color-outline-variant)] rounded-lg px-3 py-1 text-sm w-full sm:w-56">
            <span className="material-symbols-outlined text-sm mr-2 text-[color:var(--color-on-surface-variant)]">
              search
            </span>
            <input
              className="border-none focus:ring-0 p-1 w-full text-sm outline-none bg-transparent"
              placeholder="Search students..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[color:var(--color-surface-container-low)] text-[color:var(--color-on-surface-variant)] font-[family-name:var(--font-label-sm)] uppercase text-[11px] tracking-widest border-b border-[color:var(--color-outline-variant)]">
              <th className="px-6 py-4 font-bold">
                <button
                  type="button"
                  onClick={() => toggleSort('name')}
                  className="inline-flex items-center gap-1 uppercase tracking-widest font-bold hover:text-[color:var(--color-primary)]"
                >
                  Name {renderSortIcon('name')}
                </button>
              </th>
              <th className="px-6 py-4 font-bold">Last Practice</th>
              <th className="px-6 py-4 font-bold">Time Spent</th>
              <th className="px-6 py-4 font-bold">
                <button
                  type="button"
                  onClick={() => toggleSort('streak')}
                  className="inline-flex items-center gap-1 uppercase tracking-widest font-bold hover:text-[color:var(--color-primary)]"
                >
                  Streak {renderSortIcon('streak')}
                </button>
              </th>
              <th className="px-6 py-4 font-bold">
                <button
                  type="button"
                  onClick={() => toggleSort('frequency')}
                  className="inline-flex items-center gap-1 uppercase tracking-widest font-bold hover:text-[color:var(--color-primary)]"
                >
                  This Week / Frequency {renderSortIcon('frequency')}
                </button>
              </th>
              <th className="px-6 py-4 font-bold">
                <button
                  type="button"
                  onClick={() => toggleSort('debt')}
                  className="inline-flex items-center gap-1 uppercase tracking-widest font-bold hover:text-[color:var(--color-primary)]"
                >
                  Debt Status {renderSortIcon('debt')}
                </button>
              </th>
              <th className="px-6 py-4 font-bold">
                <button
                  type="button"
                  onClick={() => toggleSort('points')}
                  className="inline-flex items-center gap-1 uppercase tracking-widest font-bold hover:text-[color:var(--color-primary)]"
                >
                  Weekly Points {renderSortIcon('points')}
                </button>
              </th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-outline-variant)]">
            {hasLiveRoster ? (
              filteredAndSortedRoster.map((student) => (
                <tr key={student.id} className="hover:bg-[color:var(--color-surface-container-low)] transition-colors group">
                  <td className="px-6 py-4 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-[color:var(--color-primary-fixed-dim)] text-[color:var(--color-primary)] flex items-center justify-center font-bold text-xs mr-3">
                      {student.initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[color:var(--color-on-surface)]">{student.name}</span>
                      <span className="text-xs text-[color:var(--color-on-surface-variant)]">{student.email || 'No email'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[color:var(--color-on-surface-variant)]" suppressHydrationWarning>
                    {student.lastLogin
                      ? new Date(student.lastLogin).toLocaleDateString('en-GB', { timeZone: 'Europe/Istanbul' })
                      : <span className="italic opacity-60">Never</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-[color:var(--color-on-surface)]">{formatTimeSpent(student)}</div>
                    <div className="text-[11px] text-[color:var(--color-on-surface-variant)]">
                      {student.sessionCount ?? 0} session{(student.sessionCount ?? 0) === 1 ? '' : 's'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[color:var(--color-secondary-fixed)] text-[color:var(--color-on-secondary-fixed-variant)]">
                      <span className="material-symbols-outlined text-[14px] mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                        local_fire_department
                      </span>
                      {student.streak} {student.streak === 1 ? 'Day' : 'Days'}
                    </span>
                    <div className="text-[11px] font-bold mt-1" style={{ color: student.practicedToday ? '#15803d' : '#9ca3af' }}>
                      {student.practicedToday ? 'Practiced today' : 'Not yet today'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {(student.weekDays ?? []).map((on, i) => (
                        <span
                          key={i}
                          title={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                          className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center"
                          style={{ background: on ? '#16a34a' : '#e5e7eb', color: on ? '#fff' : '#6b7280' }}
                        >
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                        </span>
                      ))}
                    </div>
                    <div className="text-[11px] font-bold mt-1 text-[color:var(--color-on-surface-variant)]">
                      {student.weekCount ?? 0}/7 days this week · {student.monthCount ?? 0} this month
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {student.debt > 0 ? (
                      <div>
                        <span className="text-xs font-bold text-[color:var(--color-error)] px-2 py-1 bg-[color:var(--color-error-container)] rounded-lg inline-block">
                          {student.debt} pts debt
                        </span>
                        {student.openMistakes !== undefined && (
                          <div className="text-[11px] text-[color:var(--color-on-surface-variant)] mt-1">
                            {student.openMistakes} open question{student.openMistakes === 1 ? '' : 's'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-green-700 px-2 py-1 bg-green-100 rounded-lg flex items-center w-fit">
                        <span className="material-symbols-outlined text-[14px] mr-1">check_circle</span>
                        Clear
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[color:var(--color-primary)]">{student.points} / 5.0</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <ResetPasswordButton userId={student.id} />
                      <button
                        onClick={() => setEditingStudent(student)}
                        className="p-2 text-[color:var(--color-on-surface-variant)] hover:text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)]/10 rounded-full transition-colors"
                        title="Edit Student"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-[color:var(--color-on-surface-variant)] italic">
                  No students currently enrolled in this classroom.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EditStudentModal
        student={editingStudent ? { id: editingStudent.id, name: editingStudent.name, email: editingStudent.email || '' } : null}
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        onSuccess={handleEditSuccess}
      />
    </section>
  )
}
