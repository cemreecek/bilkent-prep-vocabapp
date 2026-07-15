'use client'

import React, { useState } from 'react'
import { assignTeacherToClassroomAction } from '@/app/actions/classroom'

export default function AdminTeacherAssignerAction({
  classroomId,
  currentTeacherId,
  teachers
}: {
  classroomId: string;
  currentTeacherId: string | null;
  teachers: { id: string; name: string | null }[];
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAssign = async (newId: string) => {
    if (!newId || newId === currentTeacherId) return
    setLoading(true)
    const res = await assignTeacherToClassroomAction(classroomId, newId)
    setLoading(false)
    if (res.success) {
      window.location.reload()
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="relative inline-block text-left">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs border border-[color:var(--color-outline-variant)] text-[color:var(--color-on-surface-variant)] px-3 py-1.5 rounded hover:opacity-80 transition-colors bg-[color:var(--color-surface)] shadow-sm font-bold"
      >
        Add Teacher
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-[color:var(--color-surface-container-high)] ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
            <div className="py-1 max-h-60 overflow-y-auto">
              <div className="px-4 py-2 text-xs font-semibold text-[color:var(--color-on-surface-variant)] bg-[color:var(--color-surface-container-low)]">
                Assign Teacher
              </div>
              {teachers.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    handleAssign(t.id);
                    setIsOpen(false);
                  }}
                  disabled={loading}
                  className={`w-full text-left block px-4 py-2 text-sm hover:bg-[color:var(--color-surface-container-highest)] ${t.id === currentTeacherId ? 'text-[color:var(--color-primary)] font-bold' : 'text-[color:var(--color-on-surface)]'}`}
                >
                  {t.name || "Unknown"} {t.id === currentTeacherId && '(Current)'}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
