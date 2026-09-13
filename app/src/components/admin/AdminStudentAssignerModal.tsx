'use client'

import React, { useState } from 'react'
import { assignStudentToClassroomAction, removeStudentFromClassroomAction } from '@/app/actions/classroom'

export default function AdminStudentAssignerModal({ 
  classroomId, 
  unassignedStudents,
  enrolledStudents = []
}: { 
  classroomId: string;
  unassignedStudents: { id: string; name: string | null; email: string }[];
  enrolledStudents?: { id: string; name: string | null; email: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [tab, setTab] = useState<'existing' | 'new' | 'enrolled'>('existing')
  const [loading, setLoading] = useState(false)

  const [selectedId, setSelectedId] = useState('')
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredStudents = unassignedStudents.filter(s => 
    (s.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAssignExisting = async () => {
    if (!selectedId) return
    setLoading(true)
    const res = await assignStudentToClassroomAction(classroomId, selectedId)
    setLoading(false)
    if (res.success) {
      window.location.reload()
    } else {
      alert(res.error)
    }
  }

  const handleRemove = async (studentId: string) => {
    if (!confirm("Are you sure you want to remove this student?")) return;
    setLoading(true)
    const res = await removeStudentFromClassroomAction(studentId)
    setLoading(false)
    if (res.success) {
      window.location.reload()
    } else {
      alert(res.error)
    }
  }

  const handleCreateNew = async () => {
    if (!newName || !newEmail || !newPassword) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: 'STUDENT',
          classroomId
        })
      })
      const data = await res.json()
      if (res.ok) {
        window.location.reload()
      } else {
        alert(data.error || 'Failed to create student')
      }
    } catch (e) {
      alert('Error creating student')
    }
    setLoading(false)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-xs flex items-center gap-1 bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] px-3 py-1.5 rounded hover:opacity-90 font-bold transition-all shadow-sm"
      >
        <span className="material-symbols-outlined text-sm">add</span>
        Add Student
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[color:var(--color-surface)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-[color:var(--color-outline-variant)] flex justify-between items-center bg-[color:var(--color-surface-container-low)]">
              <h3 className="font-bold text-[color:var(--color-primary)]">Add Student to Class</h3>
              <button onClick={() => setIsOpen(false)} className="text-[color:var(--color-on-surface-variant)] hover:text-black">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex border-b border-[color:var(--color-outline-variant)] mb-6">
                <button 
                  className={`flex-1 py-2 font-bold text-sm ${tab === 'existing' ? 'text-[color:var(--color-primary)] border-b-2 border-[color:var(--color-primary)]' : 'text-[color:var(--color-on-surface-variant)]'}`}
                  onClick={() => setTab('existing')}
                >
                  Existing
                </button>
                <button 
                  className={`flex-1 py-2 font-bold text-sm ${tab === 'new' ? 'text-[color:var(--color-primary)] border-b-2 border-[color:var(--color-primary)]' : 'text-[color:var(--color-on-surface-variant)]'}`}
                  onClick={() => setTab('new')}
                >
                  Create New
                </button>
                <button 
                  className={`flex-1 py-2 font-bold text-sm ${tab === 'enrolled' ? 'text-[color:var(--color-primary)] border-b-2 border-[color:var(--color-primary)]' : 'text-[color:var(--color-on-surface-variant)]'}`}
                  onClick={() => setTab('enrolled')}
                >
                  Enrolled
                </button>
              </div>

              {tab === 'existing' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[color:var(--color-on-surface-variant)] mb-1">Select Unassigned Student</label>
                    <input 
                      type="text" 
                      placeholder="Search by name, email or ID..." 
                      className="w-full p-2 border border-[color:var(--color-outline-variant)] rounded-lg bg-[color:var(--color-surface)] text-sm mb-2"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    <select 
                      className="w-full p-2 border border-[color:var(--color-outline-variant)] rounded-lg bg-[color:var(--color-surface)] text-sm"
                      value={selectedId}
                      onChange={e => setSelectedId(e.target.value)}
                    >
                      <option value="" disabled>Select a student...</option>
                      {filteredStudents.map(s => (
                        <option key={s.id} value={s.id}>{s.name || 'Unnamed'} ({s.email})</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={handleAssignExisting}
                    disabled={!selectedId || loading}
                    className="w-full bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] py-2 rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? 'Assigning...' : 'Assign to Class'}
                  </button>
                </div>
              ) : tab === 'new' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[color:var(--color-on-surface-variant)] mb-1">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-[color:var(--color-outline-variant)] rounded-lg text-sm bg-[color:var(--color-surface)]"
                      placeholder="e.g. John Doe"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[color:var(--color-on-surface-variant)] mb-1">Email</label>
                    <input 
                      type="email" 
                      className="w-full p-2 border border-[color:var(--color-outline-variant)] rounded-lg text-sm bg-[color:var(--color-surface)]"
                      placeholder="john@ug.bilkent.edu.tr"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[color:var(--color-on-surface-variant)] mb-1">Temporary Password</label>
                    <input 
                      type="password" 
                      className="w-full p-2 border border-[color:var(--color-outline-variant)] rounded-lg text-sm bg-[color:var(--color-surface)]"
                      placeholder="Must be at least 6 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={handleCreateNew}
                    disabled={!newName || !newEmail || !newPassword || loading}
                    className="w-full bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] py-2 rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create & Assign'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {enrolledStudents.length === 0 ? (
                    <p className="text-sm text-center text-[color:var(--color-on-surface-variant)] py-4">No students enrolled in this section.</p>
                  ) : (
                    enrolledStudents.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-2 border-b border-[color:var(--color-outline-variant)]">
                        <div>
                          <p className="font-bold text-sm text-[color:var(--color-on-surface)]">{s.name || 'Unnamed'}</p>
                          <p className="text-xs text-[color:var(--color-on-surface-variant)]">{s.email}</p>
                        </div>
                        <button 
                          onClick={() => handleRemove(s.id)}
                          disabled={loading}
                          className="text-xs bg-[color:var(--color-error)] text-white px-2 py-1 rounded hover:opacity-90 disabled:opacity-50 font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
