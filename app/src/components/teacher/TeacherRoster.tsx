'use client'

import React, { useState } from 'react'
import EditStudentModal from './EditStudentModal'
import ResetPasswordButton from '../ResetPasswordButton'

interface RosterStudent {
  id: string
  name: string
  email?: string
  initials: string
  streak: number
  debt: number
  points: number
  lastLogin: Date | string
  timeSpentHours: string
}

interface TeacherRosterProps {
  roster: RosterStudent[]
}

export default function TeacherRoster({ roster: initialRoster }: TeacherRosterProps) {
  const [roster, setRoster] = useState<RosterStudent[]>(initialRoster)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingStudent, setEditingStudent] = useState<RosterStudent | null>(null)

  const hasLiveRoster = roster.length > 0

  const filteredRoster = roster.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEditSuccess = async () => {
    // In a real app we'd re-fetch the roster, but a hard refresh works to sync the Server Component
    window.location.reload()
  }

  return (
    <section className="lg:col-span-8 bg-[color:var(--color-surface-container-lowest)] rounded-xl border border-[color:var(--color-outline-variant)] overflow-hidden">
      <div className="p-6 border-b border-[color:var(--color-outline-variant)] bg-[color:var(--color-surface-container-low)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="font-[family-name:var(--font-title-md)] text-[length:var(--text-title-md)] text-[color:var(--color-primary)] flex items-center">
          <span className="material-symbols-outlined mr-2">group</span>
          Student Roster
        </h3>
        <div className="flex items-center bg-white border border-[color:var(--color-outline-variant)] rounded-lg px-3 py-1 text-sm w-full md:w-auto">
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
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-[color:var(--color-surface-container-low)] text-[color:var(--color-on-surface-variant)] font-[family-name:var(--font-label-sm)] uppercase text-[11px] tracking-widest border-b border-[color:var(--color-outline-variant)]">
              <th className="px-6 py-4 font-bold">Name</th>
              <th className="px-6 py-4 font-bold">Last Login</th>
              <th className="px-6 py-4 font-bold">Time Spent</th>
              <th className="px-6 py-4 font-bold">Streak</th>
              <th className="px-6 py-4 font-bold">Debt Status</th>
              <th className="px-6 py-4 font-bold">Weekly Points</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-outline-variant)]">
            {hasLiveRoster ? (
              filteredRoster.map((student) => (
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
                    {new Date(student.lastLogin).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[color:var(--color-on-surface)]">{student.timeSpentHours}h</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[color:var(--color-secondary-fixed)] text-[color:var(--color-on-secondary-fixed-variant)]">
                      <span className="material-symbols-outlined text-[14px] mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                        local_fire_department
                      </span>
                      {student.streak} Days
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {student.debt > 0 ? (
                      <span className="text-xs font-bold text-[color:var(--color-error)] px-2 py-1 bg-[color:var(--color-error-container)] rounded-lg">{student.debt} Mistakes</span>
                    ) : (
                      <span className="text-xs font-bold text-green-700 px-2 py-1 bg-green-100 rounded-lg flex items-center w-fit">
                        <span className="material-symbols-outlined text-[14px] mr-1">check_circle</span>
                        Clear
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[color:var(--color-primary)]">{student.points} pts</span>
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
                <td colSpan={6} className="px-6 py-12 text-center text-[color:var(--color-on-surface-variant)] italic">
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
